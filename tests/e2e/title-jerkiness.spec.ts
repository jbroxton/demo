/**
 * E2E test to detect and diagnose title editing jerkiness
 * Tests for cursor jumping, value flickering, and input responsiveness
 */

import { test, expect } from '@playwright/test';

test.describe('Title Editing Jerkiness', () => {
  test.use({ storageState: 'tests/auth-state.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should detect cursor jumping and input jerkiness during title editing', async ({ page }) => {
    console.log('🧪 Testing: Title input jerkiness and cursor behavior');

    // Step 1: Open an existing page
    const sidebarPage = page.locator('[data-entity-type="page"] [data-action="open-tab"]').first();
    await expect(sidebarPage).toBeVisible({ timeout: 10000 });
    
    const pageTitle = await sidebarPage.getAttribute('data-entity-name');
    console.log(`📄 Opening page: "${pageTitle}"`);
    
    await sidebarPage.click();
    await page.waitForLoadState('networkidle');

    // Step 2: Find the title input in content area
    const titleInput = page.locator('input[placeholder="New Page"]');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Found title input');

    // Step 3: Clear and prepare for typing test
    await titleInput.click();
    await titleInput.selectText();
    await page.waitForTimeout(500);

    // Step 4: Test for cursor jumping during typing
    console.log('⌨️  Testing cursor stability during typing...');
    
    const testText = 'Testing Jerkiness';
    let cursorPositions: number[] = [];
    let inputValues: string[] = [];
    
    // Type character by character and track cursor position
    for (let i = 0; i < testText.length; i++) {
      const char = testText[i];
      await page.keyboard.type(char);
      
      // Small delay to let any optimistic updates happen
      await page.waitForTimeout(50);
      
      // Capture cursor position and input value
      const cursorPos = await titleInput.evaluate((el: HTMLInputElement) => el.selectionStart);
      const inputValue = await titleInput.inputValue();
      
      cursorPositions.push(cursorPos || 0);
      inputValues.push(inputValue);
      
      console.log(`Char ${i + 1}: "${char}" -> cursor at ${cursorPos}, value: "${inputValue}"`);
    }

    // Step 5: Analyze cursor behavior
    console.log('\n🔍 Analyzing cursor behavior...');
    
    let cursorJumps = 0;
    let expectedPosition = 1;
    
    for (let i = 0; i < cursorPositions.length; i++) {
      const actualPos = cursorPositions[i];
      const expectedPos = i + 1;
      
      if (actualPos !== expectedPos) {
        cursorJumps++;
        console.log(`❌ Cursor jump detected at position ${i + 1}: expected ${expectedPos}, got ${actualPos}`);
      }
    }
    
    if (cursorJumps === 0) {
      console.log('✅ No cursor jumps detected');
    } else {
      console.log(`❌ Found ${cursorJumps} cursor jumps out of ${testText.length} characters`);
    }

    // Step 6: Test input value stability
    console.log('\n🔍 Analyzing input value stability...');
    
    let valueFlickers = 0;
    let expectedText = '';
    
    for (let i = 0; i < inputValues.length; i++) {
      expectedText += testText[i];
      const actualValue = inputValues[i];
      
      if (!actualValue.endsWith(expectedText)) {
        valueFlickers++;
        console.log(`❌ Value flicker at step ${i + 1}: expected to end with "${expectedText}", got "${actualValue}"`);
      }
    }
    
    if (valueFlickers === 0) {
      console.log('✅ No value flickers detected');
    } else {
      console.log(`❌ Found ${valueFlickers} value flickers out of ${testText.length} characters`);
    }

    // Step 7: Test backspace behavior
    console.log('\n⌨️  Testing backspace behavior...');
    
    const initialLength = testText.length;
    const backspaceCount = 5;
    let backspaceCursorJumps = 0;
    
    for (let i = 0; i < backspaceCount; i++) {
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(50);
      
      const cursorPos = await titleInput.evaluate((el: HTMLInputElement) => el.selectionStart);
      const inputValue = await titleInput.inputValue();
      const expectedPos = initialLength - i - 1;
      const expectedLength = initialLength - i - 1;
      
      console.log(`Backspace ${i + 1}: cursor at ${cursorPos}, length ${inputValue.length} (expected pos: ${expectedPos}, length: ${expectedLength})`);
      
      if (cursorPos !== expectedPos || inputValue.length !== expectedLength) {
        backspaceCursorJumps++;
        console.log(`❌ Backspace issue: cursor should be at ${expectedPos} but is at ${cursorPos}`);
      }
    }

    // Step 8: Test rapid typing
    console.log('\n⚡ Testing rapid typing...');
    
    await titleInput.selectText();
    await page.waitForTimeout(100);
    
    const rapidText = 'RapidTypingTest';
    const startTime = Date.now();
    
    // Type rapidly without delays
    await page.keyboard.type(rapidText, { delay: 10 });
    
    const endTime = Date.now();
    const typingDuration = endTime - startTime;
    
    await page.waitForTimeout(200); // Let any async updates settle
    
    const finalValue = await titleInput.inputValue();
    const finalCursorPos = await titleInput.evaluate((el: HTMLInputElement) => el.selectionStart);
    
    console.log(`Rapid typing results:`);
    console.log(`  Duration: ${typingDuration}ms`);
    console.log(`  Expected: "${rapidText}" (${rapidText.length} chars)`);
    console.log(`  Actual: "${finalValue}" (${finalValue.length} chars)`);
    console.log(`  Cursor position: ${finalCursorPos}`);
    
    const isRapidTypingCorrect = finalValue.includes(rapidText) && finalCursorPos === finalValue.length;

    // Step 9: Summary and assertions
    console.log('\n📊 JERKINESS TEST SUMMARY');
    console.log('========================');
    console.log(`Cursor jumps during typing: ${cursorJumps}`);
    console.log(`Value flickers during typing: ${valueFlickers}`);
    console.log(`Backspace cursor issues: ${backspaceCursorJumps}`);
    console.log(`Rapid typing correct: ${isRapidTypingCorrect ? 'Yes' : 'No'}`);
    
    // Performance thresholds (these can be adjusted based on acceptable UX)
    const maxAcceptableCursorJumps = 0;
    const maxAcceptableFlickers = 0;
    const maxAcceptableBackspaceIssues = 0;
    
    if (cursorJumps > maxAcceptableCursorJumps) {
      console.log(`❌ FAIL: Too many cursor jumps (${cursorJumps} > ${maxAcceptableCursorJumps})`);
      console.log('   Likely cause: Controlled input with state updates during typing');
      console.log('   Solution: Use local state, sync on blur/debounce');
    }
    
    if (valueFlickers > maxAcceptableFlickers) {
      console.log(`❌ FAIL: Too many value flickers (${valueFlickers} > ${maxAcceptableFlickers})`);
      console.log('   Likely cause: Optimistic updates interfering with user input');
      console.log('   Solution: Remove immediate state updates during typing');
    }
    
    if (backspaceCursorJumps > maxAcceptableBackspaceIssues) {
      console.log(`❌ FAIL: Backspace behavior issues (${backspaceCursorJumps} > ${maxAcceptableBackspaceIssues})`);
      console.log('   Likely cause: State updates causing input re-render');
      console.log('   Solution: Debounce all updates, avoid immediate optimistic updates');
    }
    
    if (!isRapidTypingCorrect) {
      console.log(`❌ FAIL: Rapid typing not working correctly`);
      console.log('   Likely cause: Updates can\'t keep up with rapid input');
      console.log('   Solution: Optimize update frequency and debouncing');
    }

    // Final recommendations
    if (cursorJumps === 0 && valueFlickers === 0 && backspaceCursorJumps === 0 && isRapidTypingCorrect) {
      console.log('\n✅ PASS: Title input behavior is smooth and responsive!');
    } else {
      console.log('\n❌ FAIL: Title input has jerkiness issues that need fixing');
      console.log('\n🔧 Recommended fixes:');
      console.log('1. Use useState for local title input value');
      console.log('2. Remove immediate optimistic updates in handleTitleChange');
      console.log('3. Only sync to global state on blur or longer debounce (500ms+)');
      console.log('4. Add useCallback to prevent unnecessary re-renders');
    }

    // Assert for CI/testing purposes (adjust thresholds as needed)
    expect(cursorJumps).toBeLessThanOrEqual(maxAcceptableCursorJumps);
    expect(valueFlickers).toBeLessThanOrEqual(maxAcceptableFlickers);
    expect(backspaceCursorJumps).toBeLessThanOrEqual(maxAcceptableBackspaceIssues);
    expect(isRapidTypingCorrect).toBe(true);
  });
});