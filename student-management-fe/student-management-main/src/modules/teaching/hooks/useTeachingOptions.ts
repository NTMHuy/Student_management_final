import { useEffect, useState } from 'react';
import { teachingService } from '../services/teaching.service';
import { TeachingOptions } from '../types';

const EMPTY: TeachingOptions = { restricted: true, classes: [], subjects: [], pairs: [] };

export const useTeachingOptions = () => {
  const [options, setOptions] = useState<TeachingOptions>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    teachingService
      .getOptions()
      .then((data) => {
        if (active) setOptions(data);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Không thể tải danh sách lớp/môn.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { options, isLoading, error };
};
