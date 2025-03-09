'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { migrateClubsToFirebase } from '@/scripts/migrateClubsToFirebase';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function MigrateClubsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        router.push('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isUserAdmin = userDoc.data()?.role === 'admin';
        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

  const handleMigration = async () => {
    if (!isAdmin) return;
    
    setMigrating(true);
    try {
      const migrationResult = await migrateClubsToFirebase();
      setResult(migrationResult);
    } catch (error) {
      console.error('Error during migration:', error);
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Migrate Clubs to Firebase</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="mb-4">
          This tool will migrate all club data from the static clubData.ts file to Firebase Firestore.
          This should only be run once to initialize the database.
        </p>
        
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleMigration}
            disabled={migrating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {migrating ? 'Migrating...' : 'Start Migration'}
          </button>
          
          <button
            onClick={() => router.push('/admin-dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Back to Dashboard
          </button>
        </div>
        
        {migrating && (
          <div className="flex items-center gap-2 text-blue-600">
            <LoadingSpinner size="sm" />
            <span>Migrating clubs to Firebase...</span>
          </div>
        )}
        
        {result && (
          <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
} 