import { useInput } from 'ink';
import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiKeyStep } from './ApiKeyStep';

vi.mock('ink', async () => {
	const actual = await vi.importActual('ink');
	return {
		...actual,
		useInput: vi.fn(),
	};
});

describe('ApiKeyStep', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders API key prompt for OpenAI', () => {
		const onConfirm = vi.fn();
		const onBack = vi.fn();
		const { lastFrame } = render(<ApiKeyStep provider="OpenAI" onConfirm={onConfirm} onBack={onBack} />);

		expect(lastFrame()).toContain('Can you provide us with your OpenAI API key?');
		expect(lastFrame()).toContain('Get your key at: https://platform.openai.com/api-keys');
	});

	it('calls onBack when ESC is pressed', () => {
		const onConfirm = vi.fn();
		const onBack = vi.fn();
		render(<ApiKeyStep provider="OpenAI" onConfirm={onConfirm} onBack={onBack} />);

		const inputHandler = (useInput as any).mock.calls[0][0];
		inputHandler('', { escape: true });

		expect(onBack).toHaveBeenCalled();
	});
});
