import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiCacheService } from './ai-cache.service';
import { SimpleRagService } from './rag/simple-rag.service';
import { LocalEmbedderService } from './rag/local-embedder.service';

@Global()
@Module({
  controllers: [AiController],
  providers: [AiService, AiCacheService, SimpleRagService, LocalEmbedderService],
  exports: [AiService, AiCacheService, SimpleRagService, LocalEmbedderService],
})
export class AiModule {}
