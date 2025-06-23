import { useEffect, useRef, useState } from "react";
import api from "../services/api.service";

type usefetchArgs = {
  url: string;
  autoFetch?: boolean;
  transformer?: (data: any) => any;
  onSuccess?: (data: any) => any;
  onError?: (error: any) => any;
  pollInterval?: number;
  retryOnFailCount?: number;
  retryOnFailInterval?: number;
};

const useFetch = ({
  url,
  autoFetch = true,
  transformer,
  onSuccess,
  onError,
  pollInterval,
  retryOnFailCount = 0,
  retryOnFailInterval = 1000,
}: usefetchArgs) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>("");
  const [loading, setLoading] = useState<boolean>(false);

  //useRefs for pollInterval and retryCount-using useRef bcz there was no requirement of UI updates and need of re-rendering
  const fetchSuccessful = useRef<number | null>(null);
  const retryCount = useRef(0);
  //ref for abortController for cancelling api functionality
  const abortController = useRef<AbortController |null>(null);

  //cleanup function for fetchSuccessful
  const clearPoll = () => {
    if (fetchSuccessful.current) {
      clearInterval(fetchSuccessful.current);
      fetchSuccessful.current = null;
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
      const response = await api.get(url, {
        signal: abortController.current.signal,
      });
      const result = transformer ? transformer(response.data) : response.data;
      setData(result);
      retryCount.current = 0;

      if (onSuccess) {
        onSuccess(result);
      }
      // pollInterval will happen only if API run was successful
      if (pollInterval && !fetchSuccessful.current) {
        fetchSuccessful.current = setInterval(fetchResponse, pollInterval);
      }
    } catch (e: any) {
      if (e.name === "CanceledError" || e.name === "AbortError") {
        return;
      }
      if (retryOnFailCount > retryCount.current) {
        setTimeout(() => {
          retryCount.current += 1;
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
      setTimeout(() => setLoading(false), leftOverTime > 0 ? leftOverTime : 0);
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
    cancel
  };
};

export default useFetch;
