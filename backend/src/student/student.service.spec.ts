import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StudentService', () => {
  let service: StudentService;
  let prisma: PrismaService;

  const mockPrisma = {
    student: {
      findUnique: jest.fn(),
    },
    teacherStudent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    parentStudent: {
      findMany: jest.fn(),
    },
    teacherStudentSubject: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<StudentService>(StudentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConnections', () => {
    it('should return teachers and parents', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 100n });
      mockPrisma.teacherStudent.findMany.mockResolvedValue([
        {
          id: 1n,
          teacher: { id: 't1', name: 'Teacher1' },
          managedSubjects: [{ kyokwa: '수학', isActive: true }],
        },
      ]);
      mockPrisma.parentStudent.findMany.mockResolvedValue([
        {
          id: 2n,
          parent: { id: 'p1', name: 'Parent1' },
          relation: 'mom',
        },
      ]);

      const result = await service.getConnections(1);

      expect(result.teachers).toHaveLength(1);
      expect(result.teachers[0].name).toBe('Teacher1');
      expect(result.parents).toHaveLength(1);
    });
  });

  describe('updateTeacherPermissions', () => {
    it('should update permissions correctly', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 100n });
      mockPrisma.teacherStudent.findUnique.mockResolvedValue({ id: 1n });

      // Case 1: Allow 'Math' (Create/Enable)
      const permissions = [{ kyokwa: '수학', allowed: true }];

      mockPrisma.teacherStudentSubject.findFirst.mockResolvedValue(null); // Not existing yet

      await service.updateTeacherPermissions(1, 't1', permissions);

      expect(mockPrisma.teacherStudentSubject.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          teacherStudentId: 1n,
          kyokwa: '수학',
          allSubjects: true,
        }),
      });
    });

    it('should revoke permissions correctly', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 100n });
      mockPrisma.teacherStudent.findUnique.mockResolvedValue({ id: 1n });

      // Case 2: Disallow 'Math'
      const permissions = [{ kyokwa: '수학', allowed: false }];

      await service.updateTeacherPermissions(1, 't1', permissions);

      expect(mockPrisma.teacherStudentSubject.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          teacherStudentId: 1n,
          kyokwa: '수학',
          endDate: null,
        }),
        data: expect.objectContaining({
          endDate: expect.any(Date),
        }),
      });
    });
  });
});
