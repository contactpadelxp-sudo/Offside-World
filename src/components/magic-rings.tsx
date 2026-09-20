"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./magic-rings.css";

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
`;

interface MagicRingsProps {
  color?: string;
  colorTwo?: string;
  speed?: number;
  ringCount?: number;
  attenuation?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  scaleRate?: number;
  opacity?: number;
  blur?: number;
  noiseAmount?: number;
  rotation?: number;
  ringGap?: number;
  fadeIn?: number;
  fadeOut?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  hoverScale?: number;
  parallax?: number;
  clickBurst?: boolean;
}

export default function MagicRings({
  color = "#fc42ff",
  colorTwo = "#42fcff",
  speed = 1,
  ringCount = 6,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 1,
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false,
}: MagicRingsProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef([0, 0]);
  const smoothMouseRef = useRef([0, 0]);
  const hoverAmountRef = useRef(0);
  const isHoveredRef = useRef(false);
  const burstRef = useRef(0);

  /*
    POURQUOI CETTE BOÎTE, ET POURQUOI ELLE NE SE REMPLIT PLUS PENDANT LE RENDU.

    La boucle d'animation tourne dans `requestAnimationFrame`, hors de React,
    et ne doit surtout pas être recréée à chaque changement de prop : reconstruire
    la scène WebGL à chaque image ferait clignoter le fond. Elle lit donc les
    props dans une référence, que le rendu tenait à jour.

    Écrire dans une référence PENDANT le rendu est une violation des règles de
    React, et pas une formalité : en rendu concurrent, un rendu peut être
    abandonné. La boîte aurait alors gardé les valeurs d'un écran qui n'a
    jamais existé, et la boucle les aurait peintes.

    L'affectation passe donc dans un effet sans tableau de dépendances — il
    s'exécute après CHAQUE rendu réellement validé, ce qui est exactement la
    garantie qu'on cherchait. La valeur initiale est passée à `useRef`, qui ne
    la lit qu'au premier rendu : la boucle ne voit jamais `null`.
  */
  const props: MagicRingsProps = {
    color, colorTwo, speed, ringCount, attenuation, lineThickness,
    baseRadius, radiusStep, scaleRate, opacity, noiseAmount,
    rotation, ringGap, fadeIn, fadeOut, followMouse, mouseInfluence,
    hoverScale, parallax, clickBurst,
  };
  const propsRef = useRef<MagicRingsProps>(props);
  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true });
    } catch {
      return;
    }

    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      return;
    }

    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const uniforms: Record<string, { value: unknown }> = {
      uTime: { value: 0 },
      uAttenuation: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color() },
      uColorTwo: { value: new THREE.Color() },
      uLineThickness: { value: 0 },
      uBaseRadius: { value: 0 },
      uRadiusStep: { value: 0 },
      uScaleRate: { value: 0 },
      uRingCount: { value: 0 },
      uOpacity: { value: 1 },
      uNoiseAmount: { value: 0 },
      uRotation: { value: 0 },
      uRingGap: { value: 1.6 },
      uFadeIn: { value: 0.5 },
      uFadeOut: { value: 0.75 },
      uMouse: { value: new THREE.Vector2() },
      uMouseInfluence: { value: 0 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: 1 },
      uParallax: { value: 0 },
      uBurst: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      (uniforms.uResolution.value as THREE.Vector2).set(w * dpr, h * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current[0] = (e.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    };
    const onMouseEnter = () => { isHoveredRef.current = true; };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
      mouseRef.current[0] = 0;
      mouseRef.current[1] = 0;
    };
    const onClick = () => { burstRef.current = 1; };

    mount.addEventListener("mousemove", onMouseMove);
    mount.addEventListener("mouseenter", onMouseEnter);
    mount.addEventListener("mouseleave", onMouseLeave);
    mount.addEventListener("click", onClick);

    let frameId = 0;
    const animate = (t: number) => {
      frameId = requestAnimationFrame(animate);
      const p = propsRef.current;

      smoothMouseRef.current[0] += (mouseRef.current[0] - smoothMouseRef.current[0]) * 0.08;
      smoothMouseRef.current[1] += (mouseRef.current[1] - smoothMouseRef.current[1]) * 0.08;
      hoverAmountRef.current += ((isHoveredRef.current ? 1 : 0) - hoverAmountRef.current) * 0.08;
      burstRef.current *= 0.95;
      if (burstRef.current < 0.001) burstRef.current = 0;

      uniforms.uTime.value = t * 0.001 * (p.speed ?? 1);
      uniforms.uAttenuation.value = p.attenuation;
      // Le shader écrit gl_FragColor sans conversion d'espace colorimétrique.
      // `set()` convertirait le sRGB en linéaire, et la valeur linéaire serait
      // ensuite affichée telle quelle : #f4b23f virerait à l'orange (#ff7f0e).
      // On stocke donc les composantes sRGB verbatim.
      (uniforms.uColor.value as THREE.Color).setStyle(p.color!, THREE.LinearSRGBColorSpace);
      (uniforms.uColorTwo.value as THREE.Color).setStyle(p.colorTwo!, THREE.LinearSRGBColorSpace);
      uniforms.uLineThickness.value = p.lineThickness;
      uniforms.uBaseRadius.value = p.baseRadius;
      uniforms.uRadiusStep.value = p.radiusStep;
      uniforms.uScaleRate.value = p.scaleRate;
      uniforms.uRingCount.value = p.ringCount;
      uniforms.uOpacity.value = p.opacity;
      uniforms.uNoiseAmount.value = p.noiseAmount;
      uniforms.uRotation.value = ((p.rotation ?? 0) * Math.PI) / 180;
      uniforms.uRingGap.value = p.ringGap;
      uniforms.uFadeIn.value = p.fadeIn;
      uniforms.uFadeOut.value = p.fadeOut;
      (uniforms.uMouse.value as THREE.Vector2).set(smoothMouseRef.current[0], smoothMouseRef.current[1]);
      uniforms.uMouseInfluence.value = p.followMouse ? (p.mouseInfluence ?? 0) : 0;
      uniforms.uHoverAmount.value = hoverAmountRef.current;
      uniforms.uHoverScale.value = p.hoverScale;
      uniforms.uParallax.value = p.parallax;
      uniforms.uBurst.value = p.clickBurst ? burstRef.current : 0;

      renderer.render(scene, camera);
    };

    /*
      MOUVEMENT RÉDUIT : ON REND UNE IMAGE, ET ON S'ARRÊTE.

      Ce fond est la première chose que voit un visiteur : des anneaux qui
      pulsent en continu derrière le titre, soixante fois par seconde, sans
      jamais s'interrompre. C'est précisément ce que le réglage « réduire les
      animations » d'iOS et d'Android demande de supprimer.

      On ne masque pas le fond pour autant — le hero perdrait son décor et son
      contraste. On dessine UNE image fixe, à t = 0, et on ne relance pas la
      boucle. Bénéfice secondaire : plus de GPU sollicité en permanence sur un
      téléphone, donc moins de batterie.
    */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animate(0);
      cancelAnimationFrame(frameId);
    } else {
      frameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      mount.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("mouseenter", onMouseEnter);
      mount.removeEventListener("mouseleave", onMouseLeave);
      mount.removeEventListener("click", onClick);
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={mountRef} className="magic-rings-container" style={blur > 0 ? { filter: `blur(${blur}px)` } : undefined} />;
}
