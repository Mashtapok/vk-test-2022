import { useCallback, useState } from 'react';

const API_KEY = process.env.REACT_APP_GIPHY_API_KEY as string;

type OptionsType = {
  method: string,
  urlParams: Record<string, string | number>,
  body?: any,
  headers?: any,
}

export const useHttpRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint: string, options: OptionsType) => {
      let {
        method, body = null, headers = {}, urlParams = {},
      } = options;

      setLoading(true);

      urlParams.api_key = API_KEY;

      const query = urlParams ? `${endpoint}?${Object.keys(urlParams)
          .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(urlParams[k]))
          .join('&')}`
        :
        endpoint;

      try {
        if (body) {
          body = JSON.stringify(body);
          headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`https://api.giphy.com/v1/gifs/${query}`, { method, body, headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Что-то пошло не так');
        }

        return data;
      } catch (e: any) {
        setError(e.message);
        throw e;
      } finally {
        setLoading(false);
      }
    }
    , []);

  const clearError = useCallback(() => setError(null), []);
  return { loading, request, error, clearError };
};
