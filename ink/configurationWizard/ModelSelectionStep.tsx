import { Select } from '@inkjs/ui';
import { Box, Text, useInput } from 'ink';
import React, { useMemo, useState } from 'react';
import { BlinkingTextInput } from '../components/BlinkingTextInput';
import { emitToListeners } from '../emitters/listener';

export function ModelSelectionStep({
	title,
	models,
	defaultValue,
	onConfirm,
	onBack,
}: {
	title: string;
	models: string[];
	defaultValue: string;
	onConfirm: (model: string) => void;
	onBack: () => void;
}) {
	const [isCustom, setIsCustom] = useState(false);

	useInput((input, key) => {
		if (key.escape) {
			if (isCustom) {
				setIsCustom(false);
			} else {
				onBack();
			}
		}
	});

	const modelOptions = useMemo(() => {
		const defaultIndex = models.indexOf(defaultValue);
		const sortedModels = defaultIndex >= 0 && models[defaultIndex]
			? [
				models[defaultIndex],
				...models.slice(0, defaultIndex),
				...models.slice(defaultIndex + 1),
			]
			: models;
		return [
			...sortedModels.map(m => ({ label: m, value: m })),
			{ label: 'Other...', value: 'other' },
		];
	}, [models, defaultValue]);

	if (isCustom) {
		return (
			<Box flexDirection="column">
				<Text>Enter custom model name for: {title}</Text>
				<BlinkingTextInput
					defaultValue={defaultValue}
					onSubmit={(v) => {
						if (v === 'exit') {
							emitToListeners('ExitUI', undefined);
						} else {
							onConfirm(v || defaultValue || '');
						}
					}}
				/>
				<Box marginTop={1}>
					<Text dimColor>Press &lt;esc&gt; to go back, &lt;enter&gt; to select</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>{title}</Text>
			<Select
				options={modelOptions}
				onChange={(v) => {
					if (v === 'other') {
						setIsCustom(true);
					} else {
						onConfirm(v);
					}
				}}
			/>
			<Box marginTop={1}>
				<Text dimColor>Press &lt;esc&gt; to go back, &lt;enter&gt; to select</Text>
			</Box>
		</Box>
	);
}
