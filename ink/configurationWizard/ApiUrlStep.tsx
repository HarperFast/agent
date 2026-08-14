import { Box, Text, useInput } from 'ink';
import React from 'react';
import { BlinkingTextInput } from '../components/BlinkingTextInput';
import { emitToListeners } from '../emitters/listener';
import type { ModelProvider } from '../models/config';

export function ApiUrlStep(
	{ provider, defaultValue, onConfirm, onBack }: {
		provider: ModelProvider;
		defaultValue: string;
		onConfirm: (key: string) => void;
		onBack: () => void;
	},
) {
	useInput((input, key) => {
		if (key.escape) {
			onBack();
		}
	});

	const defaultApi: Record<string, string> = {
		OpenAI: '',
		Anthropic: '',
		Google: '',
		Ollama: 'http://localhost:11434/api',
	};

	return (
		<Box flexDirection="column">
			<Text>Where are you hosting {provider}?</Text>
			<Box marginTop={1}>
				<BlinkingTextInput
					defaultValue={defaultValue || ''}
					placeholder={defaultApi[provider] || ''}
					onSubmit={(v) => {
						if (v === 'exit') {
							emitToListeners('ExitUI', undefined);
						} else {
							onConfirm(v || defaultValue || defaultApi[provider] || '');
						}
					}}
				/>
			</Box>
			<Box marginTop={1}>
				<Text dimColor>Press &lt;esc&gt; to go back, &lt;enter&gt; to proceed</Text>
			</Box>
		</Box>
	);
}
