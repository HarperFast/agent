import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderStep } from './ProviderStep';

describe('ProviderStep', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders provider selection message', () => {
		const onConfirm = vi.fn();
		const { lastFrame } = render(<ProviderStep onConfirm={onConfirm} />);

		expect(lastFrame()).toContain('What model provider would you like to use today?');
	});
});
