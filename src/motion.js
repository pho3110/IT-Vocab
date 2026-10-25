// Damped spring sampled for the Web Animations API. Position is expressed in px;
// velocity is px/s. The final keyframe always lands exactly on the target.
export function springFrames(from, to, velocity = 0, reducedMotion = false) {
  if (reducedMotion || Math.abs(to - from) < .1) return [{ offset: 0, x: to }, { offset: 1, x: to }];
  const duration = .54;
  const omega = 20;
  const damping = .84;
  const dampedOmega = omega * Math.sqrt(1 - damping * damping);
  const displacement = from - to;
  const maxSpeed = Math.min(1400, Math.abs(displacement) * 20 + 40);
  const boundedVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, velocity));
  const coefficient = (boundedVelocity + damping * omega * displacement) / dampedOmega;
  return Array.from({ length: 37 }, (_, index) => {
    const offset = index / 36;
    const time = offset * duration;
    const x = to + Math.exp(-damping * omega * time) * (displacement * Math.cos(dampedOmega * time) + coefficient * Math.sin(dampedOmega * time));
    return { offset, x: index === 36 ? to : x };
  });
}

export function glassDeformation(velocity, directTouch = true, reducedMotion = false) {
  if (reducedMotion) return { scaleX: 1, scaleY: 1, skew: 0 };
  const speed = Math.min(1, Math.abs(velocity) / 1600) * (directTouch ? 1 : .3);
  return { scaleX: 1 + speed * .16, scaleY: 1 - speed * .075, skew: Math.sign(velocity) * speed * -3 };
}
