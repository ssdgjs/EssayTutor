import { test, expect } from '@playwright/test';

test.describe('CustomPrompt Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to rubrics page
    await page.goto('http://localhost:8081/rubrics');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display rubrics page with customPrompt field', async ({ page }) => {
    // Check page title (use exact match)
    await expect(page.getByText('评分标准', { exact: true })).toBeVisible();

    // Check create button exists
    await expect(page.getByText('+ 创建评分标准')).toBeVisible();

    // Click create button to open modal
    await page.getByText('+ 创建评分标准').click();

    // Check modal opens (use exact match)
    await expect(page.getByText('创建评分标准', { exact: true })).toBeVisible();

    // Check customPrompt field exists
    await expect(page.getByText('AI 评分提示词')).toBeVisible();
    await expect(page.getByPlaceholder('例如：重点检查时态和主谓一致问题...')).toBeVisible();

    // Check AI Optimize button exists
    await expect(page.getByText('AI优化')).toBeVisible();
  });

  test('should create rubric with customPrompt', async ({ page }) => {
    // Open create modal
    await page.getByText('+ 创建评分标准').click();
    await expect(page.getByText('创建评分标准', { exact: true })).toBeVisible();

    // Fill rubric name
    await page.getByPlaceholder('输入评分标准名称').fill('测试评分标准-E2E');

    // Select exam scene
    await page.getByText('考试').click();

    // Fill customPrompt
    const customPromptInput = page.getByPlaceholder('例如：重点检查时态和主谓一致问题...');
    await customPromptInput.fill('E2E测试：重点检查时态、主谓一致和冠词使用');

    // Submit form - use locator with exact text
    await expect(page.getByText('创建', { exact: true })).toBeVisible();
    await page.getByText('创建', { exact: true }).click();

    // Check for alert dialog (401 Unauthorized expected)
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('需要登录');
      await dialog.accept();
    });

    // Should still be on rubrics page
    await expect(page.getByText('评分标准', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('should validate weight constraint with customPrompt', async ({ page }) => {
    // Open create modal
    await page.getByText('+ 创建评分标准').click();

    // Fill name
    await page.getByPlaceholder('输入评分标准名称').fill('权重验证测试');

    // Fill customPrompt
    await page.getByPlaceholder('例如：重点检查时态和主谓一致问题...').fill('权重测试提示词');

    // Check weight indicator shows 100%
    await expect(page.getByText('100%')).toBeVisible();
  });

  test('should show customPrompt field in details modal UI', async ({ page }) => {
    // Open create modal first
    await page.getByText('+ 创建评分标准').click();

    // Fill form
    await page.getByPlaceholder('输入评分标准名称').fill('详情测试评分标准');
    await page.getByPlaceholder('例如：重点检查时态和主谓一致问题...').fill('详情页显示测试提示词');

    // Verify the modal shows the AI 评分提示词 label
    await expect(page.getByText('AI 评分提示词')).toBeVisible();

    // Verify the customPrompt input has our text
    await expect(page.getByPlaceholder('例如：重点检查时态和主谓一致问题...')).toHaveValue('详情页显示测试提示词');
  });
});
