"use client"

import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

/**
 * Updates the pagename in Firestore and navigates to that page
 * @param id - The document ID in Firestore
 * @param newPagename - The new pagename to set
 * @param options - Additional options for navigation
 * @returns Promise that resolves when the update and navigation are complete
 */
export async function updatePagenameAndNavigate(
  id: string, 
  newPagename: string,
  options?: {
    replace?: boolean,
    scroll?: boolean,
    prefetch?: boolean
  }
) {
  try {
    // Update the document in Firestore
    const docRef = doc(db, "pays", id)
    await updateDoc(docRef, {
      pagename: newPagename,
    })
    
    console.log(`Updated pagename to ${newPagename} for document ${id}`)
    
    // Navigate to the new page
    // We need to use window.location here since this is a utility function
    // and not a React component where we could use the useRouter hook
    window.location.href = `/${newPagename}`
    
    return true
  } catch (error) {
    console.error("Error updating pagename and navigating:", error)
    throw error
  }
}

/**
 * React hook for updating pagename and navigation
 * Use this in React components where you need the router
 */
export function usePagenameNavigation() {
  const router = useRouter()
  
  const navigateToPage = async (
    id: string, 
    newPagename: string,
    options?: {
      replace?: boolean,
      scroll?: boolean,
      prefetch?: boolean
    }
  ) => {
    try {
      // Update the document in Firestore
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, {
        pagename: newPagename,
      })
      
      console.log(`Updated pagename to ${newPagename} for document ${id}`)
      
      // Navigate to the new page using the router
      if (options?.replace) {
        router.replace(`/${newPagename}`, options)
      } else {
        router.push(`/${newPagename}`, options)
      }
      
      return true
    } catch (error) {
      console.error("Error updating pagename and navigating:", error)
      throw error
    }
  }
  
  return { navigateToPage }
}
