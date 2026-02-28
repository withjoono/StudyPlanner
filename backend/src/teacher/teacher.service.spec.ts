import { Test, TestingModule } from '@nestjs/testing';
import { TeacherService } from './teacher.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeacherService Permissions', () => {
  let service: TeacherService;
  let prisma: PrismaService;

  const mockPrisma = {
    teacherStudent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    dailyMission: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeacherService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMission', () => {
    it('should throw error if teacher has no permission for subject', async () => {
      // Mock access verify
      mockPrisma.teacherStudent.findUnique.mockResolvedValue({
        id: 1n,
        managedSubjects: [], // No permissions
      });

      await expect(
        service.createMission(1, 100, {
          date: '2025-01-01',
          subject: '수학',
        }),
      ).rejects.toThrow('과목에 대한 접근 권한이 없습니다');
    });

    it('should throw error if teacher has permission for different subject', async () => {
      mockPrisma.teacherStudent.findUnique.mockResolvedValue({
        id: 1n,
        managedSubjects: [{ kyokwa: '국어', endDate: null }], // Only Corean
      });

      await expect(
        service.createMission(1, 100, {
          date: '2025-01-01',
          subject: '수학',
        }),
      ).rejects.toThrow('관리 권한이 없습니다');
    });

    it('should succeed if teacher has permission', async () => {
      mockPrisma.teacherStudent.findUnique.mockResolvedValue({
        id: 1n,
        managedSubjects: [{ kyokwa: '수학', endDate: null }],
      });
      mockPrisma.dailyMission.create.mockResolvedValue({ id: 1n, subject: '수학' });

      await service.createMission(1, 100, {
        date: '2025-01-01',
        subject: '수학',
      });

      expect(mockPrisma.dailyMission.create).toHaveBeenCalled();
    });
  });

  describe('getStudentMissions', () => {
    it('should filter missions by managed subjects', async () => {
      // Teacher manages Math only
      mockPrisma.teacherStudent.findUnique.mockResolvedValue({
        id: 1n,
        managedSubjects: [{ kyokwa: '수학', endDate: null }],
      });
      mockPrisma.dailyMission.findMany.mockResolvedValue([]);

      await service.getStudentMissions(1, 100);

      expect(mockPrisma.dailyMission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subject: { in: ['수학'] },
          }),
        }),
      );
    });

    it('should return empty/blocked if no managed subjects', async () => {
      mockPrisma.teacherStudent.findUnique.mockResolvedValue({
        id: 1n,
        managedSubjects: [],
      });
      // Implementation might return early or filter by empty
      // My implementation returns [] explicitly if no managed kyokwas.

      const result = await service.getStudentMissions(1, 100);
      expect(result).toEqual([]);
      // findMany should NOT be called
      expect(mockPrisma.dailyMission.findMany).not.toHaveBeenCalled();
    });
  });
});
