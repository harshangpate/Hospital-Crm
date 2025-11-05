import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ====================
// WARD MANAGEMENT
// ====================

// Create new ward
export const createWard = async (req: Request, res: Response) => {
  try {
    const {
      wardNumber,
      wardName,
      wardType,
      floor,
      capacity,
      facilities,
      chargesPerDay,
    } = req.body;

    if (!wardNumber || !wardName || !wardType || !floor || !capacity || !chargesPerDay) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create ward
    const ward = await prisma.ward.create({
      data: {
        wardNumber,
        wardName,
        wardType,
        floor,
        capacity,
        facilities: facilities || null,
        chargesPerDay,
      },
    });

    // Auto-create bed records based on capacity
    const bedPromises = [];
    for (let i = 1; i <= capacity; i++) {
      const bedNumber = `${wardNumber}-B${i.toString().padStart(2, '0')}`;
      bedPromises.push(
        prisma.bed.create({
          data: {
            bedNumber,
            bedType: wardType === 'ICU' ? 'ICU' : wardType === 'Private' ? 'VIP' : 'Standard',
            status: 'AVAILABLE',
            wardId: ward.id,
          },
        })
      );
    }

    await Promise.all(bedPromises);

    res.status(201).json({
      message: `Ward created successfully with ${capacity} beds`,
      data: ward,
    });
  } catch (error: any) {
    console.error('Error creating ward:', error);
    res.status(500).json({ message: 'Failed to create ward', error: error.message });
  }
};

// Get all wards
export const getWards = async (req: Request, res: Response) => {
  try {
    const { wardType, floor, isActive, search } = req.query;

    const where: any = {};

    if (wardType) where.wardType = wardType;
    if (floor) where.floor = parseInt(floor as string);
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where.OR = [
        { wardNumber: { contains: search as string, mode: 'insensitive' } },
        { wardName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const wards = await prisma.ward.findMany({
      where,
      include: {
        beds: {
          select: {
            id: true,
            bedNumber: true,
            status: true,
            bedType: true,
          },
        },
      },
      orderBy: { wardNumber: 'asc' },
    });

    res.json({ data: wards });
  } catch (error: any) {
    console.error('Error fetching wards:', error);
    res.status(500).json({ message: 'Failed to fetch wards', error: error.message });
  }
};

// Get ward by ID
export const getWardById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        beds: {
          include: {
            admissions: {
              where: { 
                status: {
                  in: ['ADMITTED', 'UNDER_TREATMENT']
                }
              },
              select: {
                id: true,
                admissionNumber: true,
                admissionDate: true,
                status: true,
                patient: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            bedNumber: 'asc'
          }
        },
      },
    });

    if (!ward) {
      return res.status(404).json({ message: 'Ward not found' });
    }

    res.json({ data: ward });
  } catch (error: any) {
    console.error('Error fetching ward:', error);
    res.status(500).json({ message: 'Failed to fetch ward', error: error.message });
  }
};

// Update ward
export const updateWard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      wardNumber,
      wardName,
      wardType,
      floor,
      capacity,
      facilities,
      chargesPerDay,
    } = req.body;

    const ward = await prisma.ward.update({
      where: { id },
      data: {
        ...(wardNumber && { wardNumber }),
        ...(wardName && { wardName }),
        ...(wardType && { wardType }),
        ...(floor !== undefined && { floor }),
        ...(capacity !== undefined && { capacity }),
        ...(facilities !== undefined && { facilities }),
        ...(chargesPerDay !== undefined && { chargesPerDay }),
      },
    });

    res.json({
      message: 'Ward updated successfully',
      data: ward,
    });
  } catch (error: any) {
    console.error('Error updating ward:', error);
    res.status(500).json({ message: 'Failed to update ward', error: error.message });
  }
};

// Delete ward
export const deleteWard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if ward has occupied beds
    const occupiedBeds = await prisma.bed.count({
      where: { wardId: id, status: 'OCCUPIED' },
    });

    if (occupiedBeds > 0) {
      return res.status(400).json({
        message: 'Cannot delete ward with occupied beds',
      });
    }

    // Delete all beds in the ward first
    await prisma.bed.deleteMany({ where: { wardId: id } });

    // Delete ward
    await prisma.ward.delete({ where: { id } });

    res.json({ message: 'Ward deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting ward:', error);
    res.status(500).json({ message: 'Failed to delete ward', error: error.message });
  }
};

// ====================
// BED MANAGEMENT
// ====================

// Create new bed
export const createBed = async (req: Request, res: Response) => {
  try {
    const { bedNumber, wardId, bedType } = req.body;

    if (!bedNumber || !wardId || !bedType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if ward exists
    const ward = await prisma.ward.findUnique({ where: { id: wardId } });
    if (!ward) {
      return res.status(404).json({ message: 'Ward not found' });
    }

    // Check ward capacity
    const currentBeds = await prisma.bed.count({ where: { wardId } });
    if (currentBeds >= ward.capacity) {
      return res.status(400).json({
        message: 'Ward capacity exceeded',
      });
    }

    const bed = await prisma.bed.create({
      data: {
        bedNumber,
        wardId,
        bedType,
        status: 'AVAILABLE',
      },
      include: {
        ward: true,
      },
    });

    res.status(201).json({
      message: 'Bed created successfully',
      data: bed,
    });
  } catch (error: any) {
    console.error('Error creating bed:', error);
    res.status(500).json({ message: 'Failed to create bed', error: error.message });
  }
};

// Get all beds
export const getBeds = async (req: Request, res: Response) => {
  try {
    const { wardId, status, bedType, isActive, search } = req.query;

    const where: any = {};

    if (wardId) where.wardId = wardId;
    if (status) where.status = status;
    if (bedType) where.bedType = bedType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (search) {
      where.bedNumber = { contains: search as string, mode: 'insensitive' };
    }

    const beds = await prisma.bed.findMany({
      where,
      include: {
        ward: true,
        admissions: {
          where: { status: 'ADMITTED' },
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    gender: true,
                    dateOfBirth: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { bedNumber: 'asc' },
    });

    res.json({ data: beds });
  } catch (error: any) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ message: 'Failed to fetch beds', error: error.message });
  }
};

// Get bed by ID
export const getBedById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const bed = await prisma.bed.findUnique({
      where: { id },
      include: {
        ward: true,
        admissions: {
          where: { status: 'ADMITTED' },
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    gender: true,
                    dateOfBirth: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    res.json({ data: bed });
  } catch (error: any) {
    console.error('Error fetching bed:', error);
    res.status(500).json({ message: 'Failed to fetch bed', error: error.message });
  }
};

// Update bed
export const updateBed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If status is being changed to OCCUPIED, ensure it's not already occupied
    if (updates.status === 'OCCUPIED') {
      const bed = await prisma.bed.findUnique({ where: { id } });
      if (bed && bed.status === 'OCCUPIED') {
        return res.status(400).json({ message: 'Bed is already occupied' });
      }
    }

    const bed = await prisma.bed.update({
      where: { id },
      data: updates,
      include: {
        ward: true,
      },
    });

    res.json({
      message: 'Bed updated successfully',
      data: bed,
    });
  } catch (error: any) {
    console.error('Error updating bed:', error);
    res.status(500).json({ message: 'Failed to update bed', error: error.message });
  }
};

// Delete bed
export const deleteBed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if bed is occupied
    const bed = await prisma.bed.findUnique({ where: { id } });
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    if (bed.status === 'OCCUPIED') {
      return res.status(400).json({
        message: 'Cannot delete occupied bed',
      });
    }

    await prisma.bed.delete({ where: { id } });

    res.json({ message: 'Bed deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting bed:', error);
    res.status(500).json({ message: 'Failed to delete bed', error: error.message });
  }
};

// Get bed availability stats
export const getBedStats = async (req: Request, res: Response) => {
  try {
    const [
      totalBeds,
      availableBeds,
      occupiedBeds,
      maintenanceBeds,
      reservedBeds,
    ] = await Promise.all([
      prisma.bed.count({ where: { isActive: true } }),
      prisma.bed.count({ where: { status: 'AVAILABLE', isActive: true } }),
      prisma.bed.count({ where: { status: 'OCCUPIED', isActive: true } }),
      prisma.bed.count({ where: { status: 'UNDER_MAINTENANCE', isActive: true } }),
      prisma.bed.count({ where: { status: 'RESERVED', isActive: true } }),
    ]);

    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0';

    // Get ward-wise stats
    const wards = await prisma.ward.findMany({
      where: { isActive: true },
      include: {
        beds: {
          where: { isActive: true },
        },
      },
    });

    const wardStats = wards.map(ward => ({
      wardId: ward.id,
      wardName: ward.wardName,
      wardNumber: ward.wardNumber,
      wardType: ward.wardType,
      capacity: ward.capacity,
      occupied: ward.occupiedBeds,
      available: ward.capacity - ward.occupiedBeds,
      occupancyRate: ward.capacity > 0 ? ((ward.occupiedBeds / ward.capacity) * 100).toFixed(1) : '0',
    }));

    res.json({
      data: {
        totalBeds,
        availableBeds,
        occupiedBeds,
        maintenanceBeds,
        reservedBeds,
        occupancyRate: parseFloat(occupancyRate),
        wardStats,
      },
    });
  } catch (error: any) {
    console.error('Error fetching bed stats:', error);
    res.status(500).json({ message: 'Failed to fetch bed statistics', error: error.message });
  }
};

// Sync bed statuses with actual admissions
export const syncBedStatuses = async (req: Request, res: Response) => {
  try {
    // Get all beds marked as OCCUPIED
    const occupiedBeds = await prisma.bed.findMany({
      where: { status: 'OCCUPIED' },
      include: {
        admissions: {
          where: {
            status: {
              in: ['ADMITTED', 'UNDER_TREATMENT']
            }
          }
        }
      }
    });

    let fixed = 0;
    const updates = [];

    // Find beds that are marked OCCUPIED but have no active admissions
    for (const bed of occupiedBeds) {
      if (bed.admissions.length === 0) {
        // This bed is marked OCCUPIED but has no active admission - fix it
        updates.push(
          prisma.bed.update({
            where: { id: bed.id },
            data: { status: 'AVAILABLE' }
          })
        );
        fixed++;
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Also fix ward occupied counts
    const wards = await prisma.ward.findMany({
      include: {
        beds: {
          where: { status: 'OCCUPIED' }
        }
      }
    });

    const wardUpdates = [];
    for (const ward of wards) {
      const actualOccupied = ward.beds.length;
      if (ward.occupiedBeds !== actualOccupied) {
        wardUpdates.push(
          prisma.ward.update({
            where: { id: ward.id },
            data: { occupiedBeds: actualOccupied }
          })
        );
      }
    }

    if (wardUpdates.length > 0) {
      await Promise.all(wardUpdates);
    }

    res.json({
      message: 'Bed statuses synced successfully',
      data: {
        bedsFixed: fixed,
        wardsUpdated: wardUpdates.length
      }
    });
  } catch (error: any) {
    console.error('Error syncing bed statuses:', error);
    res.status(500).json({ message: 'Failed to sync bed statuses', error: error.message });
  }
};

// Create missing beds for wards that don't have bed records
export const createMissingBeds = async (req: Request, res: Response) => {
  try {
    // Get all wards with their beds
    const wards = await prisma.ward.findMany({
      include: {
        beds: true
      }
    });

    let totalBedsCreated = 0;
    const wardsUpdated = [];

    for (const ward of wards) {
      const existingBedCount = ward.beds.length;
      const bedsToCreate = ward.capacity - existingBedCount;

      if (bedsToCreate > 0) {
        // Create missing beds
        const bedPromises = [];
        for (let i = existingBedCount + 1; i <= ward.capacity; i++) {
          const bedNumber = `${ward.wardNumber}-B${i.toString().padStart(2, '0')}`;
          bedPromises.push(
            prisma.bed.create({
              data: {
                bedNumber,
                bedType: ward.wardType === 'ICU' ? 'ICU' : ward.wardType === 'Private' ? 'VIP' : 'Standard',
                status: 'AVAILABLE',
                wardId: ward.id,
              },
            })
          );
        }

        await Promise.all(bedPromises);
        totalBedsCreated += bedsToCreate;
        wardsUpdated.push({
          wardName: ward.wardName,
          bedsCreated: bedsToCreate
        });
      }
    }

    res.json({
      message: 'Missing beds created successfully',
      data: {
        totalBedsCreated,
        wardsUpdated
      }
    });
  } catch (error: any) {
    console.error('Error creating missing beds:', error);
    res.status(500).json({ message: 'Failed to create missing beds', error: error.message });
  }
};
