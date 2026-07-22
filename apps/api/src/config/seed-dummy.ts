import { query, getDbPool } from './database';

async function seed() {
  console.log('Seeding dummy user and garages...');
  try {
    let ownerId: string;

    // Check if any user exists
    const usersResult = await query('SELECT id FROM users LIMIT 1');
    if (usersResult.rows.length > 0) {
      ownerId = usersResult.rows[0].id;
      console.log(`Using existing user ID as owner: ${ownerId}`);
    } else {
      // If no users exist, create one
      ownerId = '00000000-0000-0000-0000-000000000001';
      await query(
        `INSERT INTO users (id, mobile_number, name, status)
         VALUES ($1, '9999999999', 'Seed Owner', 'active')`,
        [ownerId]
      );
      console.log(`Created new owner user: ${ownerId}`);
    }

    const garagesToSeed = [
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'SpeedFix Auto Care',
        address: 'Kondapur, Hyderabad',
        specializations: ['Engine', 'Brakes'],
        rating_avg: 4.6,
        rating_count: 128,
        response_mins: 30,
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'QuickPit Service Center',
        address: 'Madhapur, Hyderabad',
        specializations: ['Maintenance', 'Tyres'],
        rating_avg: 4.5,
        rating_count: 96,
        response_mins: 40,
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        name: 'AutoWorks Garage',
        address: 'Gachibowli, Hyderabad',
        specializations: ['Brakes', 'Suspension'],
        rating_avg: 4.4,
        rating_count: 110,
        response_mins: 45,
      },
    ];

    for (const g of garagesToSeed) {
      await query(
        `INSERT INTO garages (id, owner_user_id, name, address, specializations, approval_status, rating_avg, rating_count, response_mins)
         VALUES ($1, $2, $3, $4, $5, 'approved', $6, $7, $8)
         ON CONFLICT (id) DO UPDATE 
         SET name = EXCLUDED.name, address = EXCLUDED.address, specializations = EXCLUDED.specializations, rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count, response_mins = EXCLUDED.response_mins`,
        [g.id, ownerId, g.name, g.address, g.specializations, g.rating_avg, g.rating_count, g.response_mins]
      );
      console.log(`Seeded garage: ${g.name}`);
    }

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    const pool = getDbPool();
    await pool.end();
  }
}

seed();
