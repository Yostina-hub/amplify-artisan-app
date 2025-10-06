import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private supabase;

  constructor(private jwtService: JwtService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async validateUser(email: string, password: string): Promise<any> {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*, companies(id, name, status), branches(id, name)')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password_hash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      branchId: user.branch_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        company: user.companies,
        branch: user.branches,
      },
    };
  }

  async register(registerDto: any) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const { data: user, error } = await this.supabase
      .from('users')
      .insert({
        email: registerDto.email,
        password_hash: hashedPassword,
        full_name: registerDto.fullName,
        role: registerDto.role || 'user',
        company_id: registerDto.companyId,
        branch_id: registerDto.branchId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }

    return this.login(user);
  }

  async resetPassword(email: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      return { message: 'If email exists, reset link has been sent' };
    }

    return { message: 'Password reset email sent' };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await this.supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Failed to update password');
    }

    return { message: 'Password updated successfully' };
  }
}
