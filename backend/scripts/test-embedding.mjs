/**
 * Embedding API 连通性验证脚本
 * 
 * 用法: node scripts/test-embedding.mjs
 * 
 * 从 .env 中读取 EMBEDDING_* 配置，测试向量嵌入是否正常工作。
 */

import 'dotenv/config';
import OpenAI from 'openai';

const apiKey = process.env.EMBEDDING_API_KEY || process.env.DEEPSEEK_API_KEY;
const baseURL = process.env.EMBEDDING_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'https://api.openai.com/v1';
const model = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';

console.log('='.repeat(60));
console.log('🔍 Embedding API 验证');
console.log('='.repeat(60));
console.log(`模型:     ${model}`);
console.log(`端点:     ${baseURL}`);
console.log(`API Key:  ${apiKey ? apiKey.slice(0, 8) + '...' + apiKey.slice(-4) : '(空)'}`);
console.log('-'.repeat(60));

if (!apiKey) {
  console.error('❌ 错误: 未配置 API Key！请设置 EMBEDDING_API_KEY 或 DEEPSEEK_API_KEY');
  process.exit(1);
}

const client = new OpenAI({ baseURL, apiKey });

async function main() {
  // 测试文本
  const testText = '什么是Java中的多态？请举例说明。';

  console.log(`📝 测试文本: "${testText}"`);
  console.log('⏳ 正在调用 Embedding API...\n');

  const start = Date.now();

  try {
    const resp = await client.embeddings.create({
      model,
      input: testText,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    const vector = resp.data[0].embedding;
    const dimensions = vector.length;
    const usage = resp.usage;

    console.log('✅ 调用成功！');
    console.log(`⏱️  耗时: ${elapsed} 秒`);
    console.log(`📐 向量维度: ${dimensions}`);
    console.log(`📊 Token 用量: ${JSON.stringify(usage)}`);
    console.log(`🔢 前 5 维: [${vector.slice(0, 5).map(v => v.toFixed(6)).join(', ')}...]`);
    console.log('-'.repeat(60));
    console.log('🎉 Embedding API 工作正常！可以继续进行知识库数据填充。');
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.error(`❌ 调用失败 (${elapsed} 秒):`);
    console.error(`   ${err.message}`);
    if (err.status === 401) {
      console.error('\n💡 提示: API Key 无效或没有权限访问此模型。');
      console.error('   请确认:');
      console.error('   1. EMBEDDING_API_KEY 是有效的 OpenAI API Key');
      console.error('   2. 该 API Key 有权限使用 text-embedding-ada-002 模型');
      console.error('   3. 账户余额充足');
    } else if (err.status === 404) {
      console.error('\n💡 提示: 模型不存在或端点不正确。');
      console.error('   请检查 EMBEDDING_BASE_URL 和 EMBEDDING_MODEL 配置。');
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('\n💡 提示: 网络连接失败，无法访问 API 端点。');
      console.error('   请检查网络连接和 EMBEDDING_BASE_URL 配置。');
    }
    process.exit(1);
  }
}

main();
