import { Box, Text, useInput } from 'ink';
import React from 'react';
import { BlinkingTextInput } from '../components/BlinkingTextInput';
import { emitToListeners } from '../emitters/listener';
import type { ModelProvider } from '../models/config';

export function ApiKeyStep(
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

	const instructions: Record<string, string> = {
		OpenAI: 'Get your key at: https://platform.openai.com/api-keys',
		Anthropic: 'Get your key at: https://console.anthropic.com/settings/keys',
		Google: 'Get your key at: https://aistudio.google.com/app/apikey',
		Ollama: '',
	};

	return (
		<Box flexDirection="column">
			<Text>Can you provide us with your {provider} API key?</Text>
			<Text dimColor>{instructions[provider]}</Text>
			<Box marginTop={1}>
				<BlinkingTextInput
					isPassword
					defaultValue={defaultValue}
					onSubmit={(v) => {
						if (v === 'exit') {
							emitToListeners('ExitUI', undefined);
						} else {
							onConfirm(v || defaultValue || '');
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
