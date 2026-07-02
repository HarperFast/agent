import { useApp } from 'ink';
import { render } from 'ink-testing-library';
import { existsSync, writeFileSync } from 'node:fs';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchOllamaModels } from '../utils/ollama/fetchOllamaModels';
import { emitToListeners } from './emitters/listener';
import { MainConfig } from './main';

vi.mock('../utils/ollama/fetchOllamaModels');

vi.mock('ink', async () => {
	const actual = await vi.importActual('ink');
	return {
		...actual,
		useApp: vi.fn(),
	};
});

vi.mock('node:fs');

vi.mock('../lifecycle/trackedState', () => ({
	trackedState: {
		cwd: '/test/cwd',
	},
}));

// const up = '\u001B[A';
const down = '\u001B[B';
// const right = '\u001B[C';
// const left = '\u001B[D';
const enter = '\r';

// Ink re-renders asynchronously after stdin writes; polling for the expected
// frame avoids the flakiness of a fixed-duration sleep under CI load.
const waitForFrame = (lastFrame: () => string | undefined, text: string) =>
	vi.waitFor(() => expect(lastFrame()).toContain(text));

// ApiKeyStep renders input as a password field, masking typed characters as
// `*`. Wait for the masked value before submitting so the keystrokes have
// actually reached component state.
const waitForMaskedInput = (lastFrame: () => string | undefined, text: string) =>
	vi.waitFor(() => expect(lastFrame()).toContain('*'.repeat(text.length)));

describe('MainConfig', () => {
	const mockExit = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		(useApp as any).mockReturnValue({ exit: mockExit });

		// Reset process.env
		delete process.env.OLLAMA_BASE_URL;
		delete process.env.OPENAI_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;
		delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
		delete process.env.HARPER_AGENT_MODEL;
		delete process.env.HARPER_AGENT_COMPACTION_MODEL;

		// Mock fs to simulate no existing env files
		vi.mocked(existsSync).mockReturnValue(false);

		// Mock Ollama models
		vi.mocked(fetchOllamaModels).mockResolvedValue(['llama3', 'mistral']);
	});

	it('renders ConfigurationWizard', () => {
		const onComplete = vi.fn();
		const { lastFrame } = render(<MainConfig onComplete={onComplete} />);

		// ConfigurationWizard starts with ProviderStep which has this text
		expect(lastFrame()).toContain('What model provider would you like to use today?');
	});

	it('calls exit when ExitUI event is emitted', () => {
		const onComplete = vi.fn();
		render(<MainConfig onComplete={onComplete} />);

		emitToListeners('ExitUI', undefined);

		expect(mockExit).toHaveBeenCalled();
	});

	it('completes the walkthrough for OpenAI and updates .env', async () => {
		const onComplete = vi.fn();
		const { lastFrame, stdin } = render(<MainConfig onComplete={onComplete} />);

		// 1. ProviderStep - Choose OpenAI (default)
		await waitForFrame(lastFrame, 'What model provider would you like to use today?');
		stdin.write(enter);

		// 2. ApiKeyStep
		await waitForFrame(lastFrame, 'Can you provide us with your OpenAI API key?');
		stdin.write('sk-test-key');
		await waitForMaskedInput(lastFrame, 'sk-test-key');
		stdin.write(enter);

		// 3. ModelSelectionStep - Model
		await waitForFrame(lastFrame, 'What model would you like to use?');
		stdin.write(enter); // Accept default

		// 4. ModelSelectionStep - Compactor
		await waitForFrame(lastFrame, 'What model should we use for memory compaction?');
		stdin.write(enter); // Accept default

		// 5. EnvironmentSettingsStep
		await waitForFrame(lastFrame, 'Additional Settings');
		stdin.write(enter); // Accept defaults

		// Verification
		await vi.waitFor(() => expect(onComplete).toHaveBeenCalled());
		expect(vi.mocked(writeFileSync)).toHaveBeenCalled();

		// Check process.env
		expect(process.env.OPENAI_API_KEY).toBe('sk-test-key');
		expect(process.env.HARPER_AGENT_MODEL).toBe('default');
		expect(process.env.HARPER_AGENT_COMPACTION_MODEL).toBe('default');
	});

	it('completes the walkthrough for Anthropic and updates .env', async () => {
		const onComplete = vi.fn();
		const { lastFrame, stdin } = render(<MainConfig onComplete={onComplete} />);

		// 1. ProviderStep - Choose Anthropic
		await waitForFrame(lastFrame, 'What model provider would you like to use today?');
		stdin.write(down); // to Anthropic
		stdin.write(enter);

		// 2. ApiKeyStep
		await waitForFrame(lastFrame, 'Can you provide us with your Anthropic API key?');
		stdin.write('sk-ant-test-key');
		await waitForMaskedInput(lastFrame, 'sk-ant-test-key');
		stdin.write(enter);

		// 3. ModelSelectionStep - Model
		await waitForFrame(lastFrame, 'What model would you like to use?');
		stdin.write(enter); // Accept default

		// 4. ModelSelectionStep - Compactor
		await waitForFrame(lastFrame, 'What model should we use for memory compaction?');
		stdin.write(enter); // Accept default

		// 5. EnvironmentSettingsStep
		await waitForFrame(lastFrame, 'Additional Settings');
		stdin.write(enter); // Accept defaults

		// Verification
		await vi.waitFor(() => expect(onComplete).toHaveBeenCalled());
		expect(vi.mocked(writeFileSync)).toHaveBeenCalled();

		// Check process.env
		expect(process.env.ANTHROPIC_API_KEY).toBe('sk-ant-test-key');
		expect(process.env.HARPER_AGENT_MODEL).toBe('default');
		expect(process.env.HARPER_AGENT_COMPACTION_MODEL).toBe('default');
	});

	it('completes the walkthrough for Google and updates .env', async () => {
		const onComplete = vi.fn();
		const { lastFrame, stdin } = render(<MainConfig onComplete={onComplete} />);

		// 1. ProviderStep - Choose Google
		await waitForFrame(lastFrame, 'What model provider would you like to use today?');
		stdin.write(down); // to Anthropic
		stdin.write(down); // to Google
		stdin.write(enter);

		// 2. ApiKeyStep
		await waitForFrame(lastFrame, 'Can you provide us with your Google API key?');
		stdin.write('google-test-key');
		await waitForMaskedInput(lastFrame, 'google-test-key');
		stdin.write(enter);

		// 3. ModelSelectionStep - Model
		await waitForFrame(lastFrame, 'What model would you like to use?');
		stdin.write(enter); // Accept default

		// 4. ModelSelectionStep - Compactor
		await waitForFrame(lastFrame, 'What model should we use for memory compaction?');
		stdin.write(enter); // Accept default

		// 5. EnvironmentSettingsStep
		await waitForFrame(lastFrame, 'Additional Settings');
		stdin.write(enter); // Accept defaults

		// Verification
		await vi.waitFor(() => expect(onComplete).toHaveBeenCalled());
		expect(vi.mocked(writeFileSync)).toHaveBeenCalled();

		// Check process.env
		expect(process.env.GOOGLE_GENERATIVE_AI_API_KEY).toBe('google-test-key');
		expect(process.env.HARPER_AGENT_MODEL).toBe('default');
		expect(process.env.HARPER_AGENT_COMPACTION_MODEL).toBe('default');
	});

	it('completes the walkthrough for Ollama and updates .env', async () => {
		const onComplete = vi.fn();
		const { lastFrame, stdin } = render(<MainConfig onComplete={onComplete} />);

		// 1. ProviderStep - Choose Ollama
		await waitForFrame(lastFrame, 'What model provider would you like to use today?');

		stdin.write(down); // to Anthropic
		stdin.write(down); // to Google
		stdin.write(down); // to Ollama
		stdin.write(enter);

		// 2. ApiUrlStep (since provider is Ollama)
		await waitForFrame(lastFrame, 'Where are you hosting Ollama?');
		stdin.write(enter); // Accept default http://localhost:11434/api

		// 3. ModelSelectionStep - Model
		await waitForFrame(lastFrame, 'What model would you like to use?');
		stdin.write(enter); // Accept default

		// 4. ModelSelectionStep - Compactor
		await waitForFrame(lastFrame, 'What model should we use for memory compaction?');
		stdin.write(enter); // Accept default

		// 5. EnvironmentSettingsStep
		await waitForFrame(lastFrame, 'Additional Settings');
		stdin.write(enter); // Accept defaults

		// Verification
		await vi.waitFor(() => expect(onComplete).toHaveBeenCalled());
		expect(vi.mocked(writeFileSync)).toHaveBeenCalled();

		// Check process.env
		expect(process.env.OLLAMA_BASE_URL).toBe('http://localhost:11434/api');
		expect(process.env.HARPER_AGENT_MODEL).toBe('ollama-llama3');
		expect(process.env.HARPER_AGENT_COMPACTION_MODEL).toBe('ollama-llama3');
	});
});
