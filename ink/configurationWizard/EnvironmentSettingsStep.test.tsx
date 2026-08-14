import { useInput } from 'ink';
import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentSettingsStep } from './EnvironmentSettingsStep';

vi.mock('ink', async () => {
	const actual = await vi.importActual('ink');
	return {
		...actual,
		useInput: vi.fn(),
	};
});

describe('EnvironmentSettingsStep', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders settings options', () => {
		const onConfirm = vi.fn();
		const onBack = vi.fn();
		const { lastFrame } = render(
			<EnvironmentSettingsStep
				onConfirm={onConfirm}
				onBack={onBack}
			/>,
		);

		expect(lastFrame()).toContain('Additional Settings (all enabled by default):');
		expect(lastFrame()).toContain('Save Harper agent memory locally');
		expect(lastFrame()).toContain('Automatically approve code interpreter execution');
	});

	it('calls onBack when ESC is pressed', () => {
		const onConfirm = vi.fn();
		const onBack = vi.fn();
		render(
			<EnvironmentSettingsStep
				onConfirm={onConfirm}
				onBack={onBack}
			/>,
		);

		const inputHandler = (useInput as any).mock.calls[0][0];
		inputHandler('', { escape: true });

		expect(onBack).toHaveBeenCalled();
	});
});
