import { useInput } from 'ink';
import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiUrlStep } from './ApiUrlStep';

vi.mock('ink', async () => {
	const actual = await vi.importActual('ink');
	return {
		...actual,
		useInput: vi.fn(),
	};
});

describe('ApiUrlStep', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders API URL prompt for Ollama', () => {
		const onConfirm = vi.fn();
		const onBack = vi.fn();
		const { lastFrame } = render(<ApiUrlStep provider="Ollama" onConfirm={onConfirm} onBack={onBack} />);

		expect(lastFrame()).toContain('Where are you hosting Ollama?');
	});

	it('calls onBack when ESC is pressed', () => {
		const onConfirm = vi.fn();
		const onBack = vi.fn();
		render(<ApiUrlStep provider="Ollama" onConfirm={onConfirm} onBack={onBack} />);

		const inputHandler = (useInput as any).mock.calls[0][0];
		inputHandler('', { escape: true });

		expect(onBack).toHaveBeenCalled();
	});
});
