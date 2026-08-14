import { useInput } from 'ink';
import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelSelectionStep } from './ModelSelectionStep';

vi.mock('ink', async () => {
	const actual = await vi.importActual('ink');
	return {
		...actual,
		useInput: vi.fn(),
	};
});

describe('ModelSelectionStep', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders title and models', () => {
		const onConfirm = vi.fn();
		const onBack = vi.fn();
		const { lastFrame } = render(
			<ModelSelectionStep
				title="Pick a model"
				models={['model-1', 'model-2']}
				onConfirm={onConfirm}
				onBack={onBack}
			/>,
		);

		expect(lastFrame()).toContain('Pick a model');
		expect(lastFrame()).toContain('model-1');
		expect(lastFrame()).toContain('model-2');
		expect(lastFrame()).toContain('Other...');
	});

	it('calls onBack when ESC is pressed in list view', () => {
		const onConfirm = vi.fn();
		const onBack = vi.fn();
		render(
			<ModelSelectionStep
				title="Pick a model"
				models={['model-1']}
				onConfirm={onConfirm}
				onBack={onBack}
			/>,
		);

		const inputHandler = (useInput as any).mock.calls[0][0];
		inputHandler('', { escape: true });

		expect(onBack).toHaveBeenCalled();
	});
});
