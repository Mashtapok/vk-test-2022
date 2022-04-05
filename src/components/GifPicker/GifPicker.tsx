import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHttpRequest } from "../../hooks/useHttpRequest";
import { Result } from "../../types";
import { Grid } from "../MasonryGrid/Grid";
import { useDebounce } from "../../hooks/useDebounce";
// @ts-ignore
import { CSSTransition } from "react-transition-group";
import "./GifPicker.css";
import { IGif } from "@giphy/js-types";
import { useMessagesContext } from "../../hooks/useMessagesContext";
import { debounce } from "../../helpers/shared";
import { Loader } from "../common/Loader/Loader";

const GIFS_PAGE_SIZE = 25;

type GifPickerProps = {
  searchQuery: undefined | string,
  clearInput: () => void
}

export const GifPicker: React.FC<GifPickerProps> = ({ searchQuery, clearInput }) => {
  const [gifs, setGifs] = useState<IGif[]>([]);
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [pages, setPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const { request, error } = useHttpRequest();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { addMessage } = useMessagesContext();

  const loadGifs = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data, pagination }: Result = await request("search", {
        method: "GET",
        urlParams: { q: debouncedSearchQuery as string, limit: GIFS_PAGE_SIZE },
      });
      setGifs(data);
      setTotalCount(pagination.total_count);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  }, [debouncedSearchQuery, request]); // FIXME: вынестии в универс. метод

  const loadTrendingGifs = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data, pagination }: Result = await request("trending", {
        method: "GET",
        urlParams: { limit: GIFS_PAGE_SIZE },
      });
      setGifs(data);
      setTotalCount(pagination.total_count);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  }, [debouncedSearchQuery, request]);// FIXME: вынестии в универс. метод

  const clearInputWithClosingPicker = () => {
    clearInput();
    setGifs([]);
    setStyles({ display: "none" });
  };

  const restoreStyles = () => {
    setStyles({});
  };

  const scrollHandler = debounce((e: any) => {
    if (isFetching) return;

    const scrollHeight = e.target.scrollHeight;
    const scrollFromTop = e.target.scrollTop;
    const viewportHeight = e.target.clientHeight;

    if (scrollHeight - (scrollFromTop + viewportHeight) < 100 && gifs.length < totalCount) {
      setIsFetching(true);
      // FIXME: вынестии в универс. метод
      if (debouncedSearchQuery === "") {
        request("trending", {
          method: "GET",
          urlParams: { limit: GIFS_PAGE_SIZE, offset: pages * GIFS_PAGE_SIZE },
        })
          .then(({ data }: Result) => {
            setGifs(gifs.concat(data));
            setPages(prevPage => prevPage + 1);
          })
          .finally(() => setIsFetching(false));
      } else {
        request("search", {
          method: "GET",
          urlParams: { q: debouncedSearchQuery!, limit: GIFS_PAGE_SIZE, offset: pages * GIFS_PAGE_SIZE },
        })
          .then(({ data }: Result) => {
            setGifs(gifs.concat(data));
            setPages(pages + 1);
          })
          .finally(() => setIsFetching(false));
      }

    }
  }, 150);

  const sendMessage = (newGifId: string): void => {
    const newGif = gifs.find(({ id }) => id === newGifId);

    addMessage({ gif: newGif, created: new Date(), id: Date.now() });
    clearInputWithClosingPicker();
  };

  const clickHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    // Если клик не по гифке => ничего не предпринимаем
    if (!(event.target instanceof HTMLImageElement)) {
      return;
    }
    sendMessage(event.target.dataset.gif!);
  };

  const keyDownHandler = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.code === "Enter") {
      // @ts-ignore
      sendMessage(event.target.dataset.gif);
    }
  };

  // TODO: Сделать скрытие попапа при клике вне

  useEffect(() => {
    if (debouncedSearchQuery) {
      loadGifs();
    } else if (debouncedSearchQuery === "") {
      loadTrendingGifs();
    }
  }, [loadGifs, loadTrendingGifs, debouncedSearchQuery]);

  // Сброс пагинации и скролл наверх при смене поискового запроса
  useEffect(() => {
    scrollViewportRef.current?.scrollTo(0, 0);
    setPages(1);
  }, [debouncedSearchQuery]);

  return (
    <CSSTransition classNames="gif-picker"
                   in={debouncedSearchQuery !== undefined}
                   timeout={200}
                   onExit={restoreStyles}
                   unmountOnExit>
      <div className="gif-picker"
           style={styles}
           aria-label="Выбор gif изображения.">
        <div className="gif-picker__viewport"
             ref={scrollViewportRef}
             onScroll={scrollHandler}
             onClick={clickHandler}
             onKeyDown={keyDownHandler}>
          {error ? <div
            className="gif-picker--empty">При загрузке произошла ошибка. Попробуйте ещё раз, либо обновите
            страницу</div> : gifs.length ? <Grid
            width={390}
            columns={3}
            gap={10}
            gifs={gifs}
          /> : isFetching ? null : <div
            className="gif-picker--empty">По вашему запросу ничего не найдено</div>}
          <Loader visible={isFetching} />
        </div>
      </div>
    </CSSTransition>
  );
};
