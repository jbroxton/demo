/**
 * Environment Debug Test
 * 
 * This test checks what environment variables are actually being loaded
 */

describe('Environment Variables Debug', () => {
  test('should show all environment variables being used', () => {
    console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '***SET***' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***SET***' : 'NOT SET');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '***SET***' : 'NOT SET');
    console.log('NEXT_PUBLIC_OPENAI_API_KEY:', process.env.NEXT_PUBLIC_OPENAI_API_KEY ? '***SET***' : 'NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('================================');

    // Basic checks
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });

  test('should verify Supabase URL format', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log('Supabase URL being used:', supabaseUrl);
    
    expect(supabaseUrl).toBeDefined();
    
    // Should be either a production URL or localhost for development
    const isValidUrl = supabaseUrl?.match(/^https:\/\/.*\.supabase\.co$/) || 
                      supabaseUrl?.match(/^http:\/\/localhost:\d+$/);
    
    if (!isValidUrl) {
      console.error('Invalid Supabase URL format:', supabaseUrl);
    }
    
    expect(isValidUrl).toBeTruthy();
  });
});