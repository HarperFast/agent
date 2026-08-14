import { MultiSelect } from '@inkjs/ui';
import { Box, Text, useInput } from 'ink';
import React from 'react';
import { updateEnv } from '../../utils/files/updateEnv';

interface Props {
	onConfirm: () => void;
	onBack: () => void;
}

const SETTINGS = [
	{
		label: 'Save Harper agent memory locally',
		value: 'HARPER_AGENT_SESSION',
		defaultValue: './harper-agent-memory.json',
	},
	{
		label: 'Automatically approve code interpreter execution',
		value: 'HARPER_AGENT_AUTO_APPROVE_CODE_INTERPRETER',
		defaultValue: '1',
	},
	{
		label: 'Automatically approve file patches',
		value: 'HARPER_AGENT_AUTO_APPROVE_PATCHES',
		defaultValue: '1',
	},
	{
		label: 'Automatically approve shell commands',
		value: 'HARPER_AGENT_AUTO_APPROVE_SHELL',
		defaultValue: '1',
	},
	{
		label: 'Use flex tier for lower costs when possible',
		value: 'HARPER_AGENT_FLEX_TIER',
		defaultValue: 'true',
	},
];

export function EnvironmentSettingsStep({ onConfirm, onBack }: Props) {
	useInput((_input, key) => {
		if (key.escape) {
			onBack();
		}
	});

	const options = SETTINGS.map((s) => ({
		label: s.label,
		value: s.value,
	}));

	const defaultValues = SETTINGS
		.filter((s) => {
			const currentValue = process.env[s.value];
			if (currentValue === undefined) {
				return true;
			}
			return currentValue === s.defaultValue;
		})
		.map((s) => s.value);

	const handleSubmit = (values: string[]) => {
		for (const setting of SETTINGS) {
			if (values.includes(setting.value)) {
				updateEnv(setting.value, setting.defaultValue);
			}
		}
		onConfirm();
	};

	return (
		<Box flexDirection="column">
			<Text>Additional Settings (all enabled by default):</Text>
			<MultiSelect
				options={options}
				defaultValue={defaultValues}
				onSubmit={handleSubmit}
			/>
			<Text color="gray">
				Press {'<space>'} to toggle, {'<enter>'} to confirm.
			</Text>
		</Box>
	);
}
