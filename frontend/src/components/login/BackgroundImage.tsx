import React, { useState, useEffect, useRef, useCallback } from 'react';

// 类型定义
interface ImageModules {
  [key: string]: { default: string };
}

interface BackgroundImageProps {
  className?: string;
}

// 图片模块加载
const imageModules: ImageModules = import.meta.glob(
  '@/assets/images/hust/*.{jpg,jpeg,png,gif,webp}',
  { eager: true }
);
const images = Object.values(imageModules).map((mod) => mod.default);

// 工具函数
const getRandomImage = (exclude?: string): string => {
  if (images.length === 0) return '';
  if (images.length === 1) return images[0];

  let randomIndex: number;
  let selected: string;

  do {
    randomIndex = Math.floor(Math.random() * images.length);
    selected = images[randomIndex];
  } while (selected === exclude && images.length > 1);

  return selected;
};

// 图片预加载管理器
class ImagePreloader {
  private cache = new Map<string, HTMLImageElement>();

  async preload(src: string): Promise<void> {
    if (this.cache.has(src)) return;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(src, img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  preloadAll(): void {
    images.forEach((src) => this.preload(src));
  }
}

const preloader = new ImagePreloader();
preloader.preloadAll();

const BackgroundImage: React.FC<BackgroundImageProps> = ({ className = '' }) => {
  // 使用两层图片：layer1 和 layer2，交替显示
  const [layer1, setLayer1] = useState({ src: getRandomImage(), visible: true });
  const [layer2, setLayer2] = useState({ src: '', visible: false });
  const [activeLayer, setActiveLayer] = useState<1 | 2>(1); // 当前显示的是哪一层

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 切换到下一张图片
  const switchToNextImage = useCallback(async () => {
    if (images.length === 0) return;

    // 获取当前显示的图片
    const currentSrc = activeLayer === 1 ? layer1.src : layer2.src;

    // 选择下一张不同的图片
    const next = getRandomImage(currentSrc);
    if (!next || next === currentSrc) return;

    // 预加载下一张图片
    try {
      await preloader.preload(next);
    } catch (error) {
      console.warn('Image preload failed:', error);
      return;
    }

    // 在隐藏的图层上设置新图片
    if (activeLayer === 1) {
      // 当前显示 layer1，在 layer2 上准备新图片
      setLayer2({ src: next, visible: false });

      // 使用 requestAnimationFrame 确保 DOM 更新后再切换
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 隐藏 layer1，显示 layer2
          setLayer1(prev => ({ ...prev, visible: false }));
          setLayer2({ src: next, visible: true });
          setActiveLayer(2);
        });
      });
    } else {
      // 当前显示 layer2，在 layer1 上准备新图片
      setLayer1({ src: next, visible: false });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setLayer2(prev => ({ ...prev, visible: false }));
          setLayer1({ src: next, visible: true });
          setActiveLayer(1);
        });
      });
    }
  }, [activeLayer, layer1.src, layer2.src]);

  // 设置定时器
  useEffect(() => {
    if (images.length === 0) return;

    // 初始预加载
    const initialNext = getRandomImage(layer1.src);
    if (initialNext) {
      preloader.preload(initialNext).catch(console.warn);
    }

    // 3秒切换一次
    timerRef.current = setInterval(() => {
      switchToNextImage();
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [switchToNextImage, layer1.src]);

  // 如果没有图片
  if (!layer1.src) {
    return (
      <div
        className={className}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          backgroundColor: '#1a1a2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff80',
          fontSize: '16px',
        }}
      >
        暂无背景图片
      </div>
    );
  }

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.75)',
    transition: 'opacity 0.5s ease-in-out',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Layer 1 */}
      <div
        className={className}
        style={{
          ...baseStyle,
          backgroundImage: layer1.src ? `url(${layer1.src})` : 'none',
          opacity: layer1.visible ? 1 : 0,
        }}
      />

      {/* Layer 2 */}
      <div
        className={className}
        style={{
          ...baseStyle,
          backgroundImage: layer2.src ? `url(${layer2.src})` : 'none',
          opacity: layer2.visible ? 1 : 0,
        }}
      />
    </div>
  );
};

export default BackgroundImage;