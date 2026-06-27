import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminQueryDto, AdminUpdateUserDto, AdminChangePasswordDto } from './dto';

@ApiTags('管理员')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /* ========================================
     用户管理
     ======================================== */

  @Get('users')
  @ApiOperation({ summary: '管理员 - 获取用户列表（分页 + 搜索）' })
  listUsers(@Query() query: AdminQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '管理员 - 获取用户详情' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '管理员 - 修改用户信息' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: '管理员 - 删除用户' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: '管理员 - 重置用户密码' })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: AdminChangePasswordDto,
  ) {
    return this.adminService.resetPassword(id, dto);
  }

  /* ========================================
     简历管理
     ======================================== */

  @Get('resumes')
  @ApiOperation({ summary: '管理员 - 获取简历列表（跨用户，分页）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页条数' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  listResumes(@Query() query: AdminQueryDto) {
    return this.adminService.listResumes(query);
  }

  @Get('resumes/:id')
  @ApiOperation({ summary: '管理员 - 获取简历详情' })
  getResumeById(@Param('id') id: string) {
    return this.adminService.getResumeById(id);
  }

  @Delete('resumes/:id')
  @ApiOperation({ summary: '管理员 - 删除任意简历' })
  deleteResume(@Param('id') id: string) {
    return this.adminService.deleteResume(id);
  }

  /* ========================================
     面试管理
     ======================================== */

  @Get('interviews')
  @ApiOperation({ summary: '管理员 - 获取面试列表（跨用户，分页）' })
  listInterviews(@Query() query: AdminQueryDto) {
    return this.adminService.listInterviews(query);
  }

  @Get('interviews/:id')
  @ApiOperation({ summary: '管理员 - 获取面试详情（含消息）' })
  getInterviewById(@Param('id') id: string) {
    return this.adminService.getInterviewById(id);
  }

  @Delete('interviews/:id')
  @ApiOperation({ summary: '管理员 - 删除任意面试' })
  deleteInterview(@Param('id') id: string) {
    return this.adminService.deleteInterview(id);
  }

  /* ========================================
     职业规划管理
     ======================================== */

  @Get('career-plans')
  @ApiOperation({ summary: '管理员 - 获取职业规划列表（跨用户，分页）' })
  listCareerPlans(@Query() query: AdminQueryDto) {
    return this.adminService.listCareerPlans(query);
  }

  @Get('career-plans/:id')
  @ApiOperation({ summary: '管理员 - 获取职业规划详情' })
  getCareerPlanById(@Param('id') id: string) {
    return this.adminService.getCareerPlanById(id);
  }

  @Delete('career-plans/:id')
  @ApiOperation({ summary: '管理员 - 删除任意职业规划' })
  deleteCareerPlan(@Param('id') id: string) {
    return this.adminService.deleteCareerPlan(id);
  }
}
