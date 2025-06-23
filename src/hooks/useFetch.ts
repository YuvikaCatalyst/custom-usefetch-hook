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
  const fetchSuccessful=useRef<number|null>(null);
   const retryCount = useRef(0);

   //cleanup function for fetchSuccessful
  const clearPoll=()=>{
    if(fetchSuccessful.current){
      clearInterval(fetchSuccessful.current);
      fetchSuccessful.current=null;
    }
  }

  const fetchResponse = async () => {
    setLoading(true);
    try {
      const response = await api.get(url);
      const result = transformer ? transformer(response.data) : response.data;
      setData(result);
      retryCount.current=0;
      
      if (onSuccess) {
        onSuccess(result);
      }
// pollInterval will happen only if API run was successful
      if(pollInterval && !fetchSuccessful.current){
        fetchSuccessful.current=setInterval(fetchResponse,pollInterval)
      }
    } catch (e: any) {
      if (retryOnFailCount > retryCount.current) {
        setTimeout(() => {
         retryCount.current+=1;
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
      setLoading(false);
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
  };
};

export default useFetch;
