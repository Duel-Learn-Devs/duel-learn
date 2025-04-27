/**
 * Interface for User data in the UserManagement module
 */

export interface UserData {
  id: string;
  username?: string | null;
  name: string;
  email: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  joinDate: string;
  lastActive: string;
  created_at?: string; // Timestamp when the user was created
  avatar?: string | null;
  display_picture?: string | null;
  verified: boolean;
  email_verified?: boolean;
  isSSO?: boolean;
  account_type?: 'free' | 'premium' | 'admin';
  isNew?: boolean;
  location?: string;
  level?: number;
  exp?: number;
  mana?: number;
  coins?: number;
  stats?: {
    completedCourses: number;
    totalPoints: number;
    averageScore: number;
    timeSpent: string; // In hours
    createdMaterials: number;
    studiedMaterials: number;
    pvpMatches: {
      total: number;
      wins: number;
      losses: number;
      winRate: number;
    };
    peacefulMatches: {
      total: number;
      completed: number;
      abandoned: number;
      completionRate: number;
    };
    timePressuredMatches: {
      total: number;
      completed: number;
      timeouts: number;
      averageCompletionTime: string; // In minutes
    };
    achievements: {
      total: number;
      completed: number;
      inProgress: number;
      completionRate: number;
    };
    purchasedProducts: {
      total: number;
      courses: number;
      items: number;
      totalSpent: number;
    };
    subscription?: {
      type: 'monthly' | 'yearly' | 'lifetime';
      startDate: string;
      endDate?: string;
      autoRenew: boolean;
      price: number;
      status: 'active' | 'expired' | 'cancelled';
    };
  };
  // Admin dashboard specific flags
  firebase_uid?: string;
  existInSQL?: boolean;
  existInFirebaseAuth?: boolean;
  existInFirestore?: boolean;
}

/**
 * Sample user data for development and testing
 */
export const sampleUsers: UserData[] = [
  {
    id: "1",
    username: "alex_student",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    status: "active",
    joinDate: "2023-01-15",
    lastActive: "2023-05-28",
    avatar: "https://mui.com/static/images/avatar/1.jpg",
    verified: true,
    email_verified: true,
    isSSO: false,
    account_type: "premium",
    isNew: false,
    location: "New York, USA",
    level: 24,
    exp: 3450,
    mana: 85,
    coins: 2800,
    stats: {
      completedCourses: 12,
      totalPoints: 3450,
      averageScore: 87,
      timeSpent: "120",
      createdMaterials: 12,
      studiedMaterials: 10,
      pvpMatches: {
        total: 20,
        wins: 10,
        losses: 10,
        winRate: 50
      },
      peacefulMatches: {
        total: 10,
        completed: 8,
        abandoned: 2,
        completionRate: 80
      },
      timePressuredMatches: {
        total: 10,
        completed: 5,
        timeouts: 5,
        averageCompletionTime: "45"
      },
      achievements: {
        total: 10,
        completed: 8,
        inProgress: 2,
        completionRate: 80
      },
      purchasedProducts: {
        total: 10,
        courses: 8,
        items: 20,
        totalSpent: 2800
      },
      subscription: {
        type: "yearly",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        autoRenew: true,
        price: 200,
        status: "active"
      }
    }
  },
  {
    id: "2",
    username: "sarah_teacher",
    name: "Sarah Miller",
    email: "sarah.miller@example.com",
    status: "active",
    joinDate: "2022-09-05",
    lastActive: "2023-05-29",
    avatar: "https://mui.com/static/images/avatar/2.jpg",
    verified: true,
    email_verified: true,
    isSSO: true,
    account_type: "premium",
    location: "Chicago, USA",
    level: 45,
    exp: 7850,
    mana: 100,
    coins: 5200,
    stats: {
      completedCourses: 15,
      totalPoints: 7850,
      averageScore: 92,
      timeSpent: "78",
      createdMaterials: 15,
      studiedMaterials: 12,
      pvpMatches: {
        total: 25,
        wins: 12,
        losses: 13,
        winRate: 48
      },
      peacefulMatches: {
        total: 10,
        completed: 8,
        abandoned: 2,
        completionRate: 80
      },
      timePressuredMatches: {
        total: 10,
        completed: 5,
        timeouts: 5,
        averageCompletionTime: "45"
      },
      achievements: {
        total: 10,
        completed: 8,
        inProgress: 2,
        completionRate: 80
      },
      purchasedProducts: {
        total: 10,
        courses: 8,
        items: 20,
        totalSpent: 5200
      },
      subscription: {
        type: "yearly",
        startDate: "2022-09-01",
        endDate: "2023-08-31",
        autoRenew: true,
        price: 200,
        status: "active"
      }
    }
  },
  {
    id: "3",
    username: "admin_mike",
    name: "Mike Brown",
    email: "mike.brown@example.com",
    status: "active",
    joinDate: "2022-01-10",
    lastActive: "2023-05-30",
    avatar: "https://mui.com/static/images/avatar/3.jpg",
    verified: true,
    email_verified: true,
    isSSO: false,
    account_type: "admin",
    level: 50,
    exp: 10000,
    mana: 100,
    coins: 9999,
    stats: {
      completedCourses: 10,
      totalPoints: 10000,
      averageScore: 100,
      timeSpent: "1000",
      createdMaterials: 10,
      studiedMaterials: 8,
      pvpMatches: {
        total: 15,
        wins: 7,
        losses: 8,
        winRate: 47
      },
      peacefulMatches: {
        total: 5,
        completed: 4,
        abandoned: 1,
        completionRate: 80
      },
      timePressuredMatches: {
        total: 5,
        completed: 3,
        timeouts: 2,
        averageCompletionTime: "30"
      },
      achievements: {
        total: 5,
        completed: 4,
        inProgress: 1,
        completionRate: 80
      },
      purchasedProducts: {
        total: 5,
        courses: 4,
        items: 10,
        totalSpent: 9999
      },
      subscription: {
        type: "lifetime",
        startDate: "2022-01-01",
        autoRenew: false,
        price: 0,
        status: "active"
      }
    }
  },
  {
    id: "4",
    username: "emma_parent",
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    status: "inactive",
    joinDate: "2023-02-20",
    lastActive: "2023-04-15",
    avatar: "https://mui.com/static/images/avatar/4.jpg",
    verified: true,
    email_verified: true,
    isSSO: false,
    account_type: "free",
    location: "Denver, USA",
    level: 8,
    exp: 820,
    mana: 30,
    coins: 450,
    stats: {
      completedCourses: 2,
      totalPoints: 820,
      averageScore: 65,
      timeSpent: "45",
      createdMaterials: 2,
      studiedMaterials: 1,
      pvpMatches: {
        total: 5,
        wins: 2,
        losses: 3,
        winRate: 40
      },
      peacefulMatches: {
        total: 2,
        completed: 1,
        abandoned: 1,
        completionRate: 50
      },
      timePressuredMatches: {
        total: 2,
        completed: 1,
        timeouts: 1,
        averageCompletionTime: "30"
      },
      achievements: {
        total: 2,
        completed: 1,
        inProgress: 1,
        completionRate: 50
      },
      purchasedProducts: {
        total: 2,
        courses: 1,
        items: 5,
        totalSpent: 450
      },
      subscription: {
        type: "monthly",
        startDate: "2023-02-01",
        endDate: "2023-05-31",
        autoRenew: true,
        price: 15,
        status: "active"
      }
    }
  },
  {
    id: "5",
    username: "jack_student",
    name: "Jack Thompson",
    email: "jack.thompson@example.com",
    status: "suspended",
    joinDate: "2023-03-10",
    lastActive: "2023-05-01",
    avatar: "https://mui.com/static/images/avatar/5.jpg",
    verified: false,
    email_verified: false,
    isSSO: false,
    account_type: "free",
    isNew: false,
    level: 5,
    exp: 320,
    mana: 15,
    coins: 200,
    stats: {
      completedCourses: 2,
      totalPoints: 320,
      averageScore: 65,
      timeSpent: "45",
      createdMaterials: 2,
      studiedMaterials: 1,
      pvpMatches: {
        total: 2,
        wins: 1,
        losses: 1,
        winRate: 50
      },
      peacefulMatches: {
        total: 1,
        completed: 1,
        abandoned: 0,
        completionRate: 100
      },
      timePressuredMatches: {
        total: 1,
        completed: 0,
        timeouts: 1,
        averageCompletionTime: "0"
      },
      achievements: {
        total: 1,
        completed: 1,
        inProgress: 0,
        completionRate: 100
      },
      purchasedProducts: {
        total: 1,
        courses: 1,
        items: 2,
        totalSpent: 200
      },
      subscription: {
        type: "monthly",
        startDate: "2023-03-01",
        endDate: "2023-05-31",
        autoRenew: true,
        price: 10,
        status: "active"
      }
    }
  },
  {
    id: "6",
    username: "lisa_teacher",
    name: "Lisa Garcia",
    email: "lisa.garcia@example.com",
    status: "pending",
    joinDate: "2023-05-15",
    lastActive: "2023-05-15",
    avatar: "https://mui.com/static/images/avatar/6.jpg",
    verified: true,
    email_verified: true,
    isSSO: true,
    account_type: "premium",
    isNew: true,
    level: 15,
    exp: 1200,
    mana: 50,
    coins: 800,
    stats: {
      completedCourses: 8,
      totalPoints: 1200,
      averageScore: 92,
      timeSpent: "78",
      createdMaterials: 8,
      studiedMaterials: 6,
      pvpMatches: {
        total: 10,
        wins: 5,
        losses: 5,
        winRate: 50
      },
      peacefulMatches: {
        total: 2,
        completed: 2,
        abandoned: 0,
        completionRate: 100
      },
      timePressuredMatches: {
        total: 2,
        completed: 1,
        timeouts: 1,
        averageCompletionTime: "30"
      },
      achievements: {
        total: 5,
        completed: 4,
        inProgress: 1,
        completionRate: 80
      },
      purchasedProducts: {
        total: 5,
        courses: 4,
        items: 10,
        totalSpent: 800
      },
      subscription: {
        type: "yearly",
        startDate: "2023-05-01",
        autoRenew: true,
        price: 100,
        status: "active"
      }
    }
  },
  {
    id: "7",
    username: "david_student",
    name: "David Kim",
    email: "david.kim@example.com",
    status: "active",
    joinDate: "2023-04-02",
    lastActive: "2023-05-29",
    avatar: "https://mui.com/static/images/avatar/7.jpg",
    verified: true,
    email_verified: true,
    isSSO: false,
    account_type: "free",
    location: "Seattle, USA",
    level: 18,
    exp: 2100,
    mana: 65,
    coins: 1250,
    stats: {
      completedCourses: 8,
      totalPoints: 2100,
      averageScore: 92,
      timeSpent: "78",
      createdMaterials: 8,
      studiedMaterials: 6,
      pvpMatches: {
        total: 10,
        wins: 5,
        losses: 5,
        winRate: 50
      },
      peacefulMatches: {
        total: 2,
        completed: 2,
        abandoned: 0,
        completionRate: 100
      },
      timePressuredMatches: {
        total: 2,
        completed: 1,
        timeouts: 1,
        averageCompletionTime: "30"
      },
      achievements: {
        total: 5,
        completed: 4,
        inProgress: 1,
        completionRate: 80
      },
      purchasedProducts: {
        total: 5,
        courses: 4,
        items: 10,
        totalSpent: 1250
      },
      subscription: {
        type: "monthly",
        startDate: "2023-04-01",
        autoRenew: true,
        price: 10,
        status: "active"
      }
    }
  },
  {
    id: "8",
    firebase_uid: "admin123456",
    username: "super_admin",
    name: "Super Admin",
    email: "super.admin@duellearn.com",
    status: "active",
    joinDate: "2022-01-01",
    lastActive: "2023-05-31",
    avatar: "https://mui.com/static/images/avatar/8.jpg",
    verified: true,
    email_verified: true,
    isSSO: false,
    account_type: "admin",
    level: 100,
    exp: 999999,
    mana: 9999,
    coins: 999999,
    existInSQL: true,
    existInFirebaseAuth: true,
    existInFirestore: true,
    stats: {
      completedCourses: 100,
      totalPoints: 100000,
      averageScore: 100,
      timeSpent: "1000",
      createdMaterials: 100,
      studiedMaterials: 80,
      pvpMatches: {
        total: 150,
        wins: 75,
        losses: 75,
        winRate: 50
      },
      peacefulMatches: {
        total: 50,
        completed: 40,
        abandoned: 10,
        completionRate: 80
      },
      timePressuredMatches: {
        total: 50,
        completed: 30,
        timeouts: 20,
        averageCompletionTime: "45"
      },
      achievements: {
        total: 50,
        completed: 40,
        inProgress: 10,
        completionRate: 80
      },
      purchasedProducts: {
        total: 50,
        courses: 40,
        items: 100,
        totalSpent: 999999
      },
      subscription: {
        type: "lifetime",
        startDate: "2022-01-01",
        autoRenew: false,
        price: 0,
        status: "active"
      }
    }
  },
  {
    id: "9",
    firebase_uid: "system_test",
    username: "system_test",
    name: "System Test User",
    email: "system.test@duellearn.com",
    status: "inactive",
    joinDate: "2022-01-01",
    lastActive: "2022-01-01",
    avatar: null,
    verified: true,
    email_verified: true,
    isSSO: false,
    account_type: "admin",
    existInSQL: true,
    existInFirebaseAuth: false,
    existInFirestore: true,
    stats: {
      completedCourses: 0,
      totalPoints: 0,
      averageScore: 0,
      timeSpent: "0",
      createdMaterials: 0,
      studiedMaterials: 0,
      pvpMatches: {
        total: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      },
      peacefulMatches: {
        total: 0,
        completed: 0,
        abandoned: 0,
        completionRate: 0
      },
      timePressuredMatches: {
        total: 0,
        completed: 0,
        timeouts: 0,
        averageCompletionTime: "0"
      },
      achievements: {
        total: 0,
        completed: 0,
        inProgress: 0,
        completionRate: 0
      },
      purchasedProducts: {
        total: 0,
        courses: 0,
        items: 0,
        totalSpent: 0
      },
      subscription: {
        type: "lifetime",
        startDate: "2022-01-01",
        autoRenew: false,
        price: 0,
        status: "expired"
      }
    }
  }
]; 