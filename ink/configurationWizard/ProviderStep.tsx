import { Select } from '@inkjs/ui';
import { Box, Text, useInput } from 'ink';
import { useStepperInput } from 'ink-stepper';
import React, { useEffect, useMemo } from 'react';
import type { ModelProvider } from '../models/config';
import { providers } from './providers';

export function ProviderStep(
	{ defaultValue, onConfirm, onExit }: {
		defaultValue: string;
		onConfirm: (provider: ModelProvider) => void;
		onExit: () => void;
	},
) {
	const { disableNavigation, enableNavigation } = useStepperInput();
	const sortedProviders = useMemo(
		() =>
			[...providers].sort((a, b) => {
				if (a.label === defaultValue) { return -1; }
				if (b.label === defaultValue) { return 1; }
				return a.label.localeCompare(b.label);
			}),
		[defaultValue],
	);

	useEffect(() => {
		disableNavigation();
		return () => enableNavigation();
	}, [disableNavigation, enableNavigation]);

	useInput((input, key) => {
		if (key.escape) {
			onExit();
		}
	});

	return (
		<Box flexDirection="column">
			<Text>What model provider would you like to use today?</Text>
			<Select
				options={sortedProviders}
				onChange={(v) => onConfirm(v as ModelProvider)}
			/>
			<Box marginTop={1}>
				<Text dimColor>Press &lt;esc&gt; to cancel, &lt;enter&gt; to select</Text>
			</Box>
		</Box>
	);
}
