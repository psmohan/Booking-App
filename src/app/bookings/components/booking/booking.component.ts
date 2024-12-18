import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedService } from '../../services/shared.service';

interface Room {
  index: number;
  floor: number;
  booked: boolean;
  randomBooked: boolean;
}

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent {
  rooms: Map<number, Room[]> = new Map();
  numberOfRooms: number = 1;
  bookingType: string = 'Fresh'; // Default booking type

  constructor(private sharedService: SharedService) {
    this.initializeRooms();
  }

  // Initialize the hotel with 10 floors
  initializeRooms() {
    for (let floor = 1; floor <= 10; floor++) {
      const floorRooms: Room[] = [];
      const roomCount = floor === 10 ? 7 : 10; // 10th floor has 7 rooms
      for (let index = 0; index < roomCount; index++) {
        floorRooms.push({ index, floor, booked: false, randomBooked: false });
      }
      this.rooms.set(floor, floorRooms);
    }
  }

  // Generate random room selections
  randomSelection() {
    const availableRooms: Room[] = [];

    // Collect all unbooked rooms
    for (const [floorNumber, rooms] of this.rooms.entries()) {
      availableRooms.push(
        ...rooms.filter((room) => !room.booked && !room.randomBooked)
      );
    }

    const totalAvailableRooms = availableRooms.length;

    if (totalAvailableRooms === 0) {
      this.sharedService.snackBar(
        'No available rooms for random selection!',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    // Determine the number of random rooms to book (10%-50% of available rooms)
    const minRoomsToBook = Math.ceil(totalAvailableRooms * 0.1);
    const maxRoomsToBook = Math.floor(totalAvailableRooms * 0.5);
    const numberOfRoomsToBook =
      Math.floor(Math.random() * (maxRoomsToBook - minRoomsToBook + 1)) +
      minRoomsToBook;

    console.log(
      `Booking ${numberOfRoomsToBook} random rooms out of ${totalAvailableRooms} available rooms.`
    );

    const selectedRooms: Room[] = [];

    // Randomly select rooms without overlap
    while (selectedRooms.length < numberOfRoomsToBook) {
      const randomIndex = Math.floor(Math.random() * availableRooms.length);
      const randomRoom = availableRooms.splice(randomIndex, 1)[0];
      selectedRooms.push(randomRoom);
    }

    // Mark rooms as randomly booked
    selectedRooms.forEach((room) => {
      room.randomBooked = true;
    });

    // Update room states to reflect changes
    this.updateRoomStates();

    this.sharedService.snackBar(
      `Successfully booked ${selectedRooms.length} random rooms.`,
      'Close',
      {
        duration: 3000,
        panelClass: ['success-snackbar'],
      }
    );
  }

  // Book rooms based on type
  bookRooms() {
    if (this.numberOfRooms <= 0) {
      this.sharedService.snackBar(
        'Please enter a valid number of rooms to book!',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    // Ensure the number of rooms is not more than 5
    if (this.numberOfRooms > 5) {
      this.sharedService.snackBar(
        'You can only book up to 5 rooms at a time!',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    // Step 1: Check for single-floor availability (Fresh Booking only)
    if (this.bookingType === 'Fresh') {
      for (const [floorNumber, rooms] of this.rooms.entries()) {
        const availableRooms = rooms.filter(
          (room) => !room.booked && !room.randomBooked
        );
        if (availableRooms.length >= this.numberOfRooms) {
          // Book all rooms on this single floor
          availableRooms.slice(0, this.numberOfRooms).forEach((room) => {
            room.booked = true;
          });
          this.updateRoomStates();
          this.sharedService.snackBar(
            `Successfully booked ${this.numberOfRooms} rooms on Floor ${floorNumber}.`,
            'Close',
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
            }
          );
          return;
        }
      }
    }

    // Step 2: If single-floor booking isn't possible, proceed with multi-floor assignment
    const requiredRooms = this.numberOfRooms;
    const selectedRooms: Room[] = [];

    for (const [floorNumber, rooms] of this.rooms.entries()) {
      if (selectedRooms.length >= requiredRooms) break;

      const availableRooms = rooms.filter(
        (room) => !room.booked && !room.randomBooked
      );
      selectedRooms.push(
        ...availableRooms.slice(0, requiredRooms - selectedRooms.length)
      );
    }

    if (selectedRooms.length < requiredRooms) {
      this.sharedService.snackBar(
        'Not enough rooms available for the requested booking.',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    // Book the selected rooms
    selectedRooms.forEach((room) => {
      room.booked = true;
    });

    this.updateRoomStates();

    if (this.bookingType === 'Fresh') {
      this.sharedService.snackBar(
        `Successfully split ${requiredRooms} rooms across multiple floors.`,
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar'],
        }
      );
    } else if (this.bookingType === 'Associated') {
      this.sharedService.snackBar(
        `Successfully booked ${requiredRooms} rooms optimally for Associated Booking.`,
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar'],
        }
      );
    }
  }

  // Get previously booked rooms (for associated booking)
  getPreviousBookings(): Room[] {
    const previousBookings: Room[] = [];
    for (const rooms of this.rooms.values()) {
      previousBookings.push(...rooms.filter((room) => room.booked));
    }
    return previousBookings;
  }

  // Refresh room states
  updateRoomStates() {
    this.rooms = new Map(this.rooms);
  }

  resetAll() {
    // Reset all room bookings
    this.rooms.forEach((floor) => {
      floor.forEach((room) => {
        room.booked = false;
        room.randomBooked = false;
      });
    });

    // Reset user inputs
    this.numberOfRooms = 1;
    this.bookingType = 'Fresh';

    // Update room states
    this.updateRoomStates();

    this.sharedService.snackBar('All bookings have been reset!', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }
}
