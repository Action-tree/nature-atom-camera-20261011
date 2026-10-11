// A display model, not inertial navigation: each alternating arm pulse models one step.
export const ASSUMED_STEP_METRES = 0.8;
export function estimateSpeed(cadence) {
 const c=Number(cadence);
 return Number.isFinite(c)&&c>0?Math.min(240,c)*ASSUMED_STEP_METRES*60/1000:0;
}
export function projectedHundred(kmh){return kmh>0?360/kmh:null;}
