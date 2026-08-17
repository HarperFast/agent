import { useInput } from 'ink';
import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitToListeners } from '../emitters/listener';
import { ConfigurationWizard } from './ConfigurationWizard';

vi.mock('ink', async () => {
	const actual = await vi.importActual('ink');
	return {
		...actual,
		useInput: vi.fn(),
	};
});

vi.mock('../emitters/listener', () => ({
	emitToListeners: vi.fn(),
	curryEmitToListeners: vi.fn(),
}));

describe('ConfigurationWizard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders correctly starting with ProviderStep', () => {
		const onComplete = vi.fn();
		const { lastFrame } = render(<ConfigurationWizard onComplete={onComplete} />);

		expect(lastFrame()).toContain('What model provider would you like to use today?');
	});

	it('calls emitToListeners when ctrl+x is pressed', () => {
		const onComplete = vi.fn();
		render(<ConfigurationWizard onComplete={onComplete} />);

		const inputHandler = (useInput as any).mock.calls[0][0];
		inputHandler('x', { ctrl: true });

		expect(emitToListeners).toHaveBeenCalledWith('ExitUI', undefined);
	});

	it('does not complete the wizard on <esc> (each step owns back-navigation)', () => {
		const onComplete = vi.fn();
		render(<ConfigurationWizard onComplete={onComplete} />);

		const inputHandler = (useInput as any).mock.calls[0][0];
		inputHandler('', { escape: true });

		expect(onComplete).not.toHaveBeenCalled();
	});
});
