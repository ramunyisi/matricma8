"use client";

import { useEffect, useState } from "react";
import type { LearnerProfile } from "@/lib/types";
import { demoProfile } from "@/lib/sample-data";
import { getLearnerProfile, getCurrentUser } from "@/lib/learner-profile";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function useLearnerProfile() {
  const [profile, setProfile] = useState<LearnerProfile>(demoProfile);
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setIsDemo(true);
        setIsLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser(supabase);
        if (!user) return;
        const storedProfile = await getLearnerProfile(supabase, user.id);
        if (isMounted && storedProfile) {
          setProfile(storedProfile);
          setIsDemo(false);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "Could not load learner profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return { profile, isDemo, isLoading, error };
}
