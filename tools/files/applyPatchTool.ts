import { type RunContext, tool } from '@openai/agents';
import { z } from 'zod';
import { agentManager } from '../../agent/AgentManager';
import { emitToListeners } from '../../ink/emitters/listener';
import { trackedState } from '../../lifecycle/trackedState';
import { getEnv } from '../../utils/getEnv';
import { execute as getHarperSkillExecute, skills as harperSkills } from '../harper/getHarperSkillTool';
import { WorkspaceEditor } from './workspaceEditor';

const ApplyPatchParameters = z.object({
	type: z.enum(['create_file', 'update_file', 'delete_file', 'overwrite_file']).describe(
		'The type of operation to perform.',
	),
	path: z.string().describe('The path to the file to operate on.'),
	diff: z.string().optional().default('').describe(
		'The diff to apply. For create_file, every line must start with "+". For update_file, use a headerless unified diff format (start sections with "@@", and use "+", "-", or " " for lines). For overwrite_file, the diff is the raw content of the file. Do not include markers like "*** Begin Patch" or "*** Add File:".',
	),
});

function normalizedPath(p: string): string {
	return p.replace(/\\/g, '/').replace(/^\.\/?/, '');
}

async function getSkillsRead(): Promise<string[]> {
	try {
		const s = agentManager.session;
		const arr = await Promise.resolve(s?.getSkillsRead?.());
		return Array.isArray(arr) ? arr as string[] : [];
	} catch {
		return [];
	}
}

/** The skill names `getHarperSkillTool` actually accepts. */
type HarperSkillName = (typeof harperSkills)[number];

function pickExistingSkill(candidates: readonly HarperSkillName[]): HarperSkillName | null {
	for (const c of candidates) { if (harperSkills.includes(c)) { return c; } }
	return null;
}

async function requiredSkillForOperation(
	path: string,
	type: 'create_file' | 'update_file' | 'delete_file' | 'overwrite_file',
): Promise<HarperSkillName | null> {
	if (type === 'delete_file') { return null; }
	const p = normalizedPath(path);
	const read = await getSkillsRead();
	// Guard 1: resources/
	if (
		p.includes('/resources/') || p.startsWith('resources/') || p.endsWith('resources.ts') || p.endsWith('resources.js')
	) {
		if (!read.includes('automatic-apis')) {
			return pickExistingSkill(['automatic-apis']);
		}
	}
	// Guard 2: schemas/ or schema/
	if (
		p.endsWith('.graphql')
	) {
		if (!read.includes('adding-tables-with-schemas')) {
			return pickExistingSkill(['adding-tables-with-schemas']);
		}
	}
	return null;
}

const editor = new WorkspaceEditor(() => trackedState.cwd);

export async function needsApproval(
	runContext: Pick<RunContext, 'isToolApproved'>,
	operation: z.infer<typeof ApplyPatchParameters>,
	callId?: string,
) {
	try {
		// Guard check first: if a required skill is missing, bypass HITL silently
		const needed = await requiredSkillForOperation(operation.path, operation.type);
		if (needed) {
			return false;
		}
		if (callId && runContext.isToolApproved({ toolName: 'apply_patch', callId })) {
			return false;
		}

		const autoApproved = getEnv('HARPER_AGENT_AUTO_APPROVE_PATCHES', 'APPLY_PATCH_AUTO_APPROVE') === '1';

		if (autoApproved) {
			return false;
		}

		emitToListeners('OpenApprovalViewer', {
			type: operation.type,
			path: operation.path,
			diff: operation.diff,
			mode: 'ask',
			callId,
		});

		return true;
	} catch (err) {
		console.error('apply_patch approval step failed:', err);
		return false;
	}
}

export async function execute(operation: z.infer<typeof ApplyPatchParameters>) {
	try {
		// Guard check: if a required skill is missing, return that skill content instead of applying the patch
		const needed = await requiredSkillForOperation(operation.path, operation.type);
		if (needed) {
			const content = await getHarperSkillExecute({ skill: needed });
			console.error(`Understanding ${needed} is necessary before applying this patch.`);
			return {
				status: 'skill_required',
				output: `apply_patch blocked: you must understand the "${needed}" skill before writing to "${operation.path}".

REQUIRED NEXT STEP: Call apply_patch again with the EXACT same arguments:
  type="${operation.type}", path="${operation.path}", diff=<same diff as before>

PROHIBITED — do NOT attempt any of the following to work around this:
  - Use the shell tool to write or create files
  - Call set_patch_auto_approve or set_shell_auto_approve
  - Use any other workaround

Read the skill content below, then retry apply_patch immediately.

--- Skill: ${needed} ---
${content}`,
			} as const;
		}
		switch (operation.type) {
			case 'create_file':
				if (!operation.diff) {
					return { status: 'failed', output: 'Error: diff is required for create_file' } as const;
				}
				return await editor.createFile(operation as any);
			case 'update_file':
				if (!operation.diff) {
					return { status: 'failed', output: 'Error: diff is required for update_file' } as const;
				}
				return await editor.updateFile(operation as any);
			case 'overwrite_file':
				if (!operation.diff) {
					return { status: 'failed', output: 'Error: diff is required for overwrite_file' } as const;
				}
				return await editor.overwriteFile(operation as any);
			case 'delete_file':
				return await editor.deleteFile(operation as any);
			default:
				return { status: 'failed', output: `Error: Unknown operation type: ${operation.type}` } as const;
		}
	} catch (err) {
		console.error('hit unexpected error in apply patch tool', err);
		// Ensure the tool always returns something the LLM can react to
		return { status: 'failed', output: `apply_patch threw: ${String(err)}` } as const;
	}
}

export function createApplyPatchTool() {
	return tool({
		name: 'apply_patch',
		description: `Applies a patch (create, update, or delete a file) to the workspace.

SKILL GUARD: Some file paths require reading a specific Harper skill before writing. If this tool returns status "skill_required", you MUST:
  1. Read the skill content included in the response carefully.
  2. Call apply_patch again with the EXACT same type, path, and diff arguments.
Do NOT use shell, set_patch_auto_approve, set_shell_auto_approve, or any other workaround to bypass this requirement.`,
		parameters: ApplyPatchParameters,
		needsApproval,
		execute,
	});
}
