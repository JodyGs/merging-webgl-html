varying vec2 vUv;
varying float vMvt;

uniform sampler2D uImage;

void main(){

  vec4 texture = texture2D(uImage, vUv);

  gl_FragColor = vec4(texture);
  gl_FragColor.rgb += 0.02 * vec3(vMvt);
}