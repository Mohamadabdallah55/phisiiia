import React from 'react';
import { PauseCircle } from 'lucide-react';
import type { SimulationId } from '../../types';
import SpringScalesLab from './SpringScalesLab';
import VectorLab from './VectorLab';
import Motion1DLab from './Motion1DLab';
import Motion2DLab from './Motion2DLab';
import NewtonGravityLab from './NewtonGravityLab';

interface SimulationLabProps {
  simulationId: SimulationId;
  isPaused?: boolean;
}

export default function SimulationLab({ simulationId, isPaused = false }: SimulationLabProps) {
  return (
    <div className="space-y-2" data-testid="simulation-lab" data-sim-id={simulationId}>
      {isPaused && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
          <PauseCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>المحاكاة موقوفة مؤقتاً من وضع المعلم — أعد تشغيلها من شريط الأدوات للتفاعل</span>
        </div>
      )}

      {simulationId === 'spring-scales' && <SpringScalesLab isPaused={isPaused} />}

      {(simulationId === 'vectors-basics' ||
        simulationId === 'vector-products' ||
        simulationId === 'vector-addition' ||
        simulationId === 'vector-resolution') && (
        <VectorLab mode={simulationId} isPaused={isPaused} />
      )}

      {(simulationId === 'air-track' ||
        simulationId === 'motion-1d' ||
        simulationId === 'motion-graphs' ||
        simulationId === 'free-fall') && (
        <Motion1DLab mode={simulationId} isPaused={isPaused} />
      )}

      {(simulationId === 'projectile-angled' ||
        simulationId === 'projectile-horizontal' ||
        simulationId === 'circular-motion') && (
        <Motion2DLab mode={simulationId} isPaused={isPaused} />
      )}

      {(simulationId === 'newton-first' ||
        simulationId === 'newton-second' ||
        simulationId === 'newton-third' ||
        simulationId === 'universal-gravity') && (
        <NewtonGravityLab mode={simulationId} isPaused={isPaused} />
      )}
    </div>
  );
}
