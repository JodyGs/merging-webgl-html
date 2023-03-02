uniform float uTime;
uniform vec2 uHover;
uniform float uHoverState;

varying vec2 vUv;
varying float vMvt;

void main() {
  float dist = distance(uv, uHover);
  vec3 newPosition = position;
  newPosition.z += uHoverState * 10.0 * sin(dist * 10.0 + uTime);

  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;


  gl_Position = projectedPosition;

  vUv = uv;
  vMvt = uHoverState * sin(dist * 10.0 - uTime);
}