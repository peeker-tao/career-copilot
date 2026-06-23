import { Global, Module, DynamicModule, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {
  /**
   * 简单导入（默认使用全局 ConfigModule）
   */
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [RedisService],
      exports: [RedisService],
      global: true,
    };
  }

  /**
   * 支持异步导入，方便注入其它模块或自定义配置
   */
  static forRootAsync(options: { imports?: ModuleMetadata['imports'] } = {}): DynamicModule {
    const imports = Array.isArray(options.imports) ? options.imports : [];
    return {
      module: RedisModule,
      imports: [...imports, ConfigModule],
      providers: [RedisService],
      exports: [RedisService],
      global: true,
    };
  }
}
