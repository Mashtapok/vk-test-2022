import { IGif, IImage } from '@giphy/js-types';
import { useRef, useState } from 'react';

const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const closestArea = (width: number, height: number, renditions: any[]) => {
  let currentBest = Infinity;
  let result: IImage;
  // sort the renditions so we can avoid scaling up low resolutions
  renditions.forEach((rendition) => {
    const widthPercentage = rendition.width / width;
    const heightPercentage = rendition.height / height;
    // a width percentage of 1 is exact, 2 is double, .5 half etc
    const areaPercentage = widthPercentage * heightPercentage;
    // img could be bigger or smaller
    const testBest = Math.abs(1 - areaPercentage); // the closer to 0 the better
    if (testBest < currentBest) {
      currentBest = testBest;
      result = rendition;
    }
  });
  return result!;
};

export const GRID_COLORS = ['#a86868', '#41af82', '#8549c1', '#5486a0', '#fff35c'];
export const getRandomColor = () => GRID_COLORS[Math.round(Math.random() * (GRID_COLORS.length - 1))];

const findBestfit = (
  renditions: Array<IImage>,
  width: number,
  height: number,
) => {
  let [largestRendition] = renditions;
  // filter out renditions that are smaller than the target width and height by scaleUpMaxPixels value
  const testRenditions = renditions.filter(rendition => {
    if (rendition.width * rendition.height > largestRendition.width * largestRendition.height) {
      largestRendition = rendition;
    }
    return width - rendition.width <= height - rendition.height;
    // return width - rendition.width <= scaleUpMaxPixels && height - rendition.height <= scaleUpMaxPixels;
  });
  // if all are too small, use the largest we have
  if (testRenditions.length === 0) {
    return largestRendition;
  }
  // find the closest area of the filtered renditions
  return closestArea(width, height, testRenditions);
}

export function pick<T extends object, U extends keyof T>(object: T, pick: Array<U>): Pick<T, U> {
  const res: Partial<T> = {};
  pick.forEach((key: U) => {
    if (object[key] !== undefined) {
      res[key] = object[key];
    }
  });
  return res as Pick<T, U>;
}

export const getBestSize = (
  images: any,
  gifWidth: number,
  gifHeight: number,
) => {
  const matchedSizes = pick(images, [
    'original',
    'fixed_width',
    'fixed_height',
    'fixed_width_small',
    'fixed_height_small',
  ]);
  const testImages = Object.entries(matchedSizes).map(([sizeName, val]: any) => ({
    sizeName,
    ...val,
  }));

  return findBestfit(testImages, gifWidth, gifHeight);
};

export const getGifHeight = ({ images }: IGif, gifWidth: number) => {
  const { fixed_width } = images;
  if (fixed_width) {
    const { width, height } = fixed_width;
    const aspectRatio = width / height;
    return Math.round(gifWidth / aspectRatio);
  }
  return 0;
};

const noop = () => {};

type GifProps = {
  gif: IGif,

}

export const Gif = ({
                      gif,
                      width,
                      height: forcedHeight,
                      className = '',
                      backgroundColor,
                      style,
                      tabIndex,
                    }: any) => {
  // only fire seen once per gif id
  const [hasFiredSeen, setHasFiredSeen] = useState(false);
  // hovered is for the gif overlay
  const [isHovered, setHovered] = useState(false);
  // only show the gif if it's on the screen
  // if we can't use the dom (SSR), then we show the gif by default
  const [shouldShowMedia, setShouldShowMedia] = useState(true);
  // classname to target animations on image load
  const [loadedClassname, setLoadedClassName] = useState('');
  // the background color shouldn't change unless it comes from a prop or we have a sticker
  const defaultBgColor = useRef(getRandomColor());
  // the a tag the media is rendered into
  const container = useRef<HTMLDivElement | null>(null);
  // to play it safe when using SSR, we check image.complete after mount
  const image = useRef<HTMLImageElement | null>(null);
  // intersection observer with no threshold
  const showGifObserver = useRef<IntersectionObserver>();
  // intersection observer with a threshold of 1 (full element is on screen)
  const fullGifObserver = useRef<IntersectionObserver>();
  // fire hover pingback after this timeout
  const hoverTimeout = useRef<number>();
  // fire onseen ref (changes per gif, so need a ref)
  const sendOnSeen = useRef<(_: IntersectionObserverEntry) => void>(noop);

  // const onMouseOver = (e: SyntheticEvent<HTMLElement, Event>) => {
  //   clearTimeout(hoverTimeout.current!)
  //   e.persist()
  //   setHovered(true)
  //   hoverTimeout.current = window.setTimeout(() => {
  //     pingback.onGifHover(gif, user?.id, e.target as HTMLElement, attributes)
  //   }, hoverTimeoutDelay)
  // }
  //
  // useEffect(() => {
  //   // the id has changed, maybe the image has loaded
  //   if (image.current?.complete) {
  //     watchGif()
  //     onGifVisible(gif) // gif is visible, perhaps just partially
  //   }
  //   fullGifObserver.current?.disconnect()
  //   setHasFiredSeen(false)
  //   // We only want to fire this when gif id changes
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [gif.id])

  const height = forcedHeight || getGifHeight(gif, width);
  const bestSize = getBestSize(gif.images, width, height);
  console.log(bestSize);
  // @ts-ignore
  const rendition = gif.images[bestSize.sizeName];
  const background =
    backgroundColor || // <- specified background prop
    // sticker has black if no backgroundColor is specified
    (gif.is_sticker
      ? `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4AQMAAACSSKldAAAABlBMVEUhIiIWFhYoSqvJAAAAGElEQVQY02MAAv7///8PWxqIPwDZw5UGABtgwz2xhFKxAAAAAElFTkSuQmCC') 0 0`
      : defaultBgColor.current);

  return (
    <div
      style={{
        width,
        height,
        ...style,
      }}
      tabIndex={tabIndex}
    >
      <div style={{ width, height, position: 'relative' }} ref={container}>
        <picture>
          <source type='image/webp' srcSet={shouldShowMedia ? rendition.webp : placeholder} />
          <img
            ref={image}
            src={shouldShowMedia ? rendition.url : placeholder}
            style={{ background }}
            width={width}
            height={height}
            alt={gif.title}
            className='gif'
            onLoad={shouldShowMedia ? () => console.log('load') : () => {
            }}
          />
        </picture>
      </div>
    </div>
  );
};