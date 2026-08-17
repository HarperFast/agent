import { Box, useInput } from 'ink';
import { Step, Stepper } from 'ink-stepper';
import React, { useEffect, useState } from 'react';
import { getProvider } from '../../lifecycle/getModel.js';
import { trackedState } from '../../lifecycle/trackedState.js';
import { getEnvVarForProvider } from '../../utils/files/getEnvVarForProvider';
import { updateEnv } from '../../utils/files/updateEnv';
import { updateEnvKeyForProvider } from '../../utils/files/updateEnvKeyForProvider';
import { fetchOllamaModels } from '../../utils/ollama/fetchOllamaModels';
import { curryEmitToListeners, emitToListeners } from '../emitters/listener';
import type { ModelProvider } from '../models/config';
import { ApiKeyStep } from './ApiKeyStep';
import { ApiUrlStep } from './ApiUrlStep';
import { EnvironmentSettingsStep } from './EnvironmentSettingsStep';
import { compactorModelsByProvider, modelsByProvider } from './modelsByProvider';
import { ModelSelectionStep } from './ModelSelectionStep';
import { ProviderStep } from './ProviderStep';
import { StepperProgress } from './StepperProgress';

interface Props {
	onComplete: () => void;
}

export function ConfigurationWizard({ onComplete }: Props) {
	const [provider, setProvider] = useState<ModelProvider>(
		trackedState?.model && getProvider(trackedState.model) || 'OpenAI',
	);
	const [ollamaModels, setOllamaModels] = useState<string[]>([]);

	useEffect(() => {
		if (provider === 'Ollama') {
			fetchOllamaModels().then(models => {
				if (models.length > 0) {
					setOllamaModels(models);
				}
			});
		}
	}, [provider]);

	// <esc> is owned per-step (back-navigation, or leaving a sub-mode); the wizard only binds
	// global exit keys here. Handling <esc> at this level too would double-fire with the active
	// step — Ink delivers input to every mounted useInput — and complete the wizard instead.
	useInput((input, key) => {
		if (key.ctrl && input === 'x') {
			emitToListeners('ExitUI', undefined);
		}
	});

	const models = provider === 'Ollama' && ollamaModels.length > 0
		? [...new Set([...ollamaModels, ...modelsByProvider[provider]])]
		: modelsByProvider[provider];
	const compactorModels = provider === 'Ollama' && ollamaModels.length > 0
		? [...new Set([...ollamaModels, ...compactorModelsByProvider[provider]])]
		: compactorModelsByProvider[provider];

	// Every step owns its own keys: its input widget consumes <enter> and advances by calling
	// goNext() from onConfirm, and each step binds <esc> itself. The Stepper's built-in
	// bindings would double-handle <enter> on top of that, which is why every step used to
	// switch them off via disableNavigation() for its whole lifetime. Saying keyboardNav={false}
	// once states that directly, and leaves goNext() free of however the library happens to
	// gate its own navigation — ink-stepper 0.2.3 extended that gate to programmatic calls.
	return (
		<Box flexDirection="column" padding={1} minHeight={10}>
			<Stepper
				onComplete={onComplete}
				onCancel={curryEmitToListeners('ExitUI', undefined)}
				keyboardNav={false}
				renderProgress={StepperProgress}
			>
				<Step name="AI Provider">
					{({ goNext }) => (
						<ProviderStep
							defaultValue={provider}
							onConfirm={(p) => {
								setProvider(p);
								goNext();
							}}
							onExit={onComplete}
						/>
					)}
				</Step>

				<Step name={provider !== 'Ollama' ? 'API Key' : 'API'}>
					{({ goNext, goBack }) => (provider !== 'Ollama'
						? (
							<ApiKeyStep
								provider={provider}
								defaultValue={process.env[getEnvVarForProvider(provider)] || ''}
								onConfirm={(key) => {
									updateEnvKeyForProvider(provider, key);
									goNext();
								}}
								onBack={goBack}
							/>
						)
						: (
							<ApiUrlStep
								provider={provider}
								defaultValue={process.env[getEnvVarForProvider(provider)] || ''}
								onConfirm={(key) => {
									updateEnvKeyForProvider(provider, key);
									goNext();
								}}
								onBack={goBack}
							/>
						))}
				</Step>

				<Step name="Model">
					{({ goNext, goBack }) => (
						<ModelSelectionStep
							title="What model would you like to use?"
							models={models}
							defaultValue={trackedState?.model || ''}
							onConfirm={(m) => {
								const finalModelName = (provider === 'Ollama' && !m.startsWith('ollama-') && !m.includes(':'))
									? `ollama-${m}`
									: m;
								updateEnv('HARPER_AGENT_MODEL', finalModelName);
								goNext();
							}}
							onBack={goBack}
						/>
					)}
				</Step>

				<Step name="Compactor">
					{({ goNext, goBack }) => (
						<ModelSelectionStep
							title="What model should we use for memory compaction?"
							models={compactorModels}
							defaultValue={trackedState?.compactionModel || ''}
							onConfirm={(m) => {
								const finalModelName = (provider === 'Ollama' && !m.startsWith('ollama-') && !m.includes(':'))
									? `ollama-${m}`
									: m;
								updateEnv('HARPER_AGENT_COMPACTION_MODEL', finalModelName);
								goNext();
							}}
							onBack={goBack}
						/>
					)}
				</Step>

				<Step name="Settings">
					{({ goNext, goBack }) => (
						<EnvironmentSettingsStep
							onConfirm={() => {
								goNext();
							}}
							onBack={goBack}
						/>
					)}
				</Step>
			</Stepper>
		</Box>
	);
}
