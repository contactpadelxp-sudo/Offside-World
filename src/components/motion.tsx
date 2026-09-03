"use client";

import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { useRef, useEffect, useState, type ReactNode, type MouseEvent } from "react";

/* ═══ FADE IN ═══ */
export function FadeIn({
  children, delay = 0, className, ...props
}: { children: ReactNode; delay?: number; className?: string } & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className} {...props}
    >{children}</motion.div>
  );
}

/* ═══ FADE IN VIEW ═══ */
export function FadeInView({
  children, delay = 0, className,
}: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >{children}</motion.div>
  );
}

/* ═══ SCALE IN ═══ */
export function ScaleIn({
  children, delay = 0, className,
}: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >{children}</motion.div>
  );
}

/* ═══ STAGGER ═══ */
export function StaggerContainer({
  children, className, staggerDelay = 0.1,
}: { children: ReactNode; className?: string; staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ visible: { transition: { staggerChildren: staggerDelay } } }}
      className={className}
    >{children}</motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
      }}
      className={className}
    >{children}</motion.div>
  );
}

/* ═══ FLOAT ═══ */
export function Float({
  children, className, duration = 3,
}: { children: ReactNode; className?: string; duration?: number }) {
  return (
    <motion.div
      animate={{ y: [-10, 10, -10] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >{children}</motion.div>
  );
}

/* ═══ PULSE GLOW ═══ */
export function PulseGlow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >{children}</motion.div>
  );
}

/* ═══ 3D TILT CARD ═══ */
export function Tilt3D({
  children, className, intensity = 15,
}: { children: ReactNode; className?: string; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const smoothY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * intensity);
    rotateY.set(x * intensity);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX: smoothX, rotateY: smoothY, transformPerspective: 800 }}
      className={className}
    >{children}</motion.div>
  );
}

/* ═══ MAGNETIC BUTTON ═══ */
export function MagneticButton({
  children, className, strength = 0.3,
}: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, { stiffness: 300, damping: 20 });
  const smoothY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * strength);
    y.set(dy * strength);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x: smoothX, y: smoothY }}
      className={className}
    >{children}</motion.div>
  );
}

/* ═══ TEXT REVEAL (word by word) ═══ */
export function TextReveal({
  text, className, delay = 0,
}: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <motion.span
      initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}
      className={className}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: "easeOut" } },
          }}
          className="inline-block mr-[0.3em]"
        >{word}</motion.span>
      ))}
    </motion.span>
  );
}

/* ═══ COUNT UP ═══ */
export function CountUp({
  target, duration = 2, prefix = "", suffix = "", className,
}: { target: number; duration?: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { duration: duration * 1000 });
  const display = useTransform(springVal, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (isInView) motionVal.set(target);
  }, [isInView, motionVal, target]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}

/* ═══ MARQUEE ═══ */
export function Marquee({
  children, className, speed = 30,
}: { children: ReactNode; className?: string; speed?: number }) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <div className="marquee-track pointer-events-none select-none" style={{ animationDuration: `${speed}s` }}>
        {children}
        {children}
      </div>
    </div>
  );
}

/* ═══ GRADIENT BORDER WRAPPER ═══ */
export function GradientBorder({
  children, className,
}: { children: ReactNode; className?: string }) {
  return (
    <div className={`gradient-border ${className ?? ""}`}>
      {children}
    </div>
  );
}

/* ═══ WAVE DIVIDER ═══ */
export function WaveDivider({ fill = "#ffffff", flip = false, className }: { fill?: string; flip?: boolean; className?: string }) {
  return (
    <div className={`wave-divider ${className ?? ""}`} style={flip ? { transform: "rotate(180deg)" } : undefined}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill={fill} />
      </svg>
    </div>
  );
}

/* ═══ CONFETTI ═══ */
export function Confetti() {
  const colors = ["#f4b23f", "#f9a03f", "#ffd48a", "#e07c10", "#ffffff", "#ffc266"];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 2}s`,
    size: `${6 + Math.random() * 8}px`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}
