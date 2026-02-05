const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const config = require('../src/config/env');

/**
 * Script para crear o verificar usuario administrador
 * Uso: node scripts/setup-admin.js [email] [password]
 */

const DEFAULT_EMAIL = 'admin@travelbrain.com';
const DEFAULT_PASSWORD = 'Admin123!';
const SALT_ROUNDS = 10;

async function setupAdmin() {
  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Obtener email y password de argumentos o usar defaults
    const email = process.argv[2] || DEFAULT_EMAIL;
    const password = process.argv[3] || DEFAULT_PASSWORD;

    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Password: ${'*'.repeat(password.length)}\n`);

    // Verificar si ya existe un usuario con ese email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('⚠️  Usuario ya existe');
      console.log('📊 Estado actual:');
      console.log(`   - ID: ${existingUser._id}`);
      console.log(`   - Email: ${existingUser.email}`);
      console.log(`   - Name: ${existingUser.name || 'N/A'}`);
      console.log(`   - Role: ${existingUser.role}`);
      console.log(`   - Status: ${existingUser.status}`);

      // Si no es ADMIN, actualizar
      if (existingUser.role !== 'ADMIN') {
        console.log('\n🔄 Actualizando rol a ADMIN...');
        existingUser.role = 'ADMIN';
        
        // Si no tiene password, agregar uno
        if (!existingUser.passwordHash) {
          console.log('🔐 Agregando password hash...');
          existingUser.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        }
        
        await existingUser.save();
        console.log('✅ Usuario actualizado a ADMIN exitosamente');
      } else {
        console.log('\n✅ El usuario ya tiene rol ADMIN');
      }
    } else {
      // Crear nuevo usuario admin
      console.log('🆕 Creando nuevo usuario administrador...');
      
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      
      const admin = new User({
        email,
        passwordHash: hashedPassword,
        name: 'Administrator',
        username: 'admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        tz: 'America/Guayaquil'
      });

      await admin.save();
      console.log('✅ Usuario administrador creado exitosamente');
      console.log(`   - ID: ${admin._id}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Role: ${admin.role}`);
    }

    console.log('\n📋 Credenciales de acceso:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login\n');

    // Listar todos los administradores
    console.log('👥 Lista de todos los administradores:');
    const admins = await User.find({ role: 'ADMIN' });
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email} (${admin.status})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
setupAdmin();
