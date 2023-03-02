varying vec2 vUv;
uniform float uTime;
uniform sampler2D uImage;

void main(){

  vec4 texture = texture2D(uImage, vUv);

  gl_FragColor = vec4(texture);
}