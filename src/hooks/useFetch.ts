import { useEffect, useRef, useState } from "react";
import apiService from "services/api.service";

type UsefetchArgs = {
  url: string;
  autoFetch?: boolean;
  transformer?: (data: any) => any;
  onSuccess?: (data: any) => any;
  onError?: (error: any) => any;
  pollInterval?: number;
  retryOnFailCount?: number;
  retryOnFailInterval?: number;
};

const defaultArgs = {
  autoFetch: true,
  retryOnFailCount: 0,
  retryOnFailInterval: 1000,
};

const useFetch = (args: UsefetchArgs) => {
  const {
    url,
    autoFetch,
    transformer,
    onSuccess,
    onError,
    pollInterval,
    retryOnFailCount,
    retryOnFailInterval,
  } = { ...defaultArgs, ...args };

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>("");
  const [loading, setLoading] = useState<boolean>(false);

  //useRefs for pollInterval and retryCount-using useRef bcz there was no requirement of UI updates and need of re-rendering
  const fetchSuccessfulRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  //ref for abortController for cancelling api functionality
  const abortController = useRef<AbortController | null>(null);

  //cleanup function for fetchSuccessful
  const clearPoll = () => {
    if (fetchSuccessfulRef.current) {
      clearInterval(fetchSuccessfulRef.current);
      fetchSuccessfulRef.current = null;
    }
  };

  const cancel = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
  };

  const fetchResponse = async () => {
    cancel();
    abortController.current = new AbortController();
    setLoading(true);
    const initialTime = Date.now();
    try {
      const response = await apiService.get(url, {
        signal: abortController.current.signal,
      });
      const result = transformer ? transformer(response.data) : response.data;
      setData(result);
      retryCountRef.current = 0;

      if (onSuccess) {
        onSuccess(result);
      }
      // pollInterval will happen only if API run was successful
      if (pollInterval && !fetchSuccessfulRef.current) {
        fetchSuccessfulRef.current = setInterval(fetchResponse, pollInterval);
      }
    } catch (e: any) {
      if (e.name === "CanceledError" || e.name === "AbortError") {
        return;
      }
      if (retryOnFailCount > retryCountRef.current) {
        setTimeout(() => {
          retryCountRef.current += 1;
          fetchResponse();
        }, retryOnFailInterval);
      } else {
        clearPoll();
        setError(e);
        if (onError) {
          onError(e);
        }
      }
    } finally {
      const endTime = Date.now();
      const finalTime = endTime - initialTime;
      const leftOverTime = 2000 - finalTime;
      setTimeout(
        function () {
          setLoading(false);
        },
        leftOverTime > 0 ? leftOverTime : 0
      );
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchResponse();
    }

    return () => {
      clearPoll();
    };
  }, [url]);

  return {
    data,
    error,
    loading,
    refetch: fetchResponse,
    cancel,
  };
};

export default useFetch;
