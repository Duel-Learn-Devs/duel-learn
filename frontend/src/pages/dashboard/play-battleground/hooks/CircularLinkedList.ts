class Node {
    question: any;
    next: Node | null;

    constructor(question: any) {
        this.question = question;
        this.next = null;
    }
}

class CircularLinkedList {
    head: Node | null;
    tail: Node | null;

    constructor() {
        this.head = null;
        this.tail = null;
    }

    add(question: any) {
        const newNode = new Node(question);
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
            newNode.next = newNode; // Point to itself
        } else {
            newNode.next = this.head;
            this.tail!.next = newNode;
            this.tail = newNode;
        }
    }

    remove(question: any) {
        if (!this.head) return;
        let current: Node = this.head; // Ensure current is of type Node
        let previous: Node | null = this.tail; // previous can be null
    
        do {
            if (current.question === question) {
                if (current === this.head) {
                    this.tail!.next = current.next;
                    this.head = current.next;
                } else if (current === this.tail) {
                    previous!.next = current.next;
                    this.tail = previous;
                } else {
                    previous!.next = current.next;
                }
                return;
            }
            previous = current;
            current = current.next!; // Use non-null assertion since we know it's not null
        } while (current !== this.head);
    }

    getUnmasteredQuestions() {
        const questions: any[] = []; // Explicitly define the type
        if (!this.head) return questions;
        let current: Node | null = this.head; // Ensure current is of type Node or null
        do {
            if (current !== null) { // Check if current is not null
                questions.push(current.question);
                current = current.next; // Move to the next node
            }
        } while (current !== this.head);
        return questions;
    }
}

export default CircularLinkedList; 