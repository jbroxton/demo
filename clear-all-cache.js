/**
 * Complete cache clearing script
 * Run this in browser console or add to component
 */

// Clear React Query cache completely
if (window.queryClient) {
  window.queryClient.clear();
  console.log('✅ React Query cache cleared');
}

// Clear localStorage
localStorage.clear();
console.log('✅ localStorage cleared');

// Clear sessionStorage  
sessionStorage.clear();
console.log('✅ sessionStorage cleared');

// Clear cookies (if possible)
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cookies cleared');

console.log('🔄 Please refresh the page now');