class FPSCamera extends PerspectiveCamera
{
	constructor(gl, programArray=[], aspect=1, viewRadians=Math.PI/4, near=0.01, far=1000.0, canvasWidth, moveSpeed=0.1, turnSpeed= 1, position=new Vector(), rotation=new Quaternion())
	{
		super(gl, programArray, aspect, viewRadians, near, far, position, rotation);

		this.moveSpeed = moveSpeed;
		this.turnSpeed = turnSpeed;

		// trackers for 2d rotation (no "roll" ==> no z rotation)
		this.rotX = 0;
		this.rotY = 0;
		this.rotLimitX = Math.PI / 2;
		this.rotLimitY = Math.PI;
		this.setRots();

		// wasd qe "is pressed down"
		this.W = false;
		this.A = false;
		this.S = false;
		this.D = false;

		// arrow keys "is pressed down"
		this.L = false;
		this.U = false;
		this.R = false;
		this.Do = false;

		// keycodes wasd qe
		this.keycodeW = 87;
		this.keycodeA = 65;
		this.keycodeS = 83;
		this.keycodeD = 68;

		this.mouseDX = 0;
		this.mouseDY = 0;

	}

	onKeyDown(event)
	{
		switch (event.keyCode)
		{
			case this.keycodeW:
				this.W = true;
				break;
			case this.keycodeA:
				this.A = true;
				break;
			case this.keycodeS:
				this.S = true;
				break;
			case this.keycodeD:
				this.D = true;
				break;
			default:
				break;
		}
	}

	onKeyUp(event)
	{
		switch (event.keyCode)
		{
			case this.keycodeW:
				this.W = false;
				break;
			case this.keycodeA:
				this.A = false;
				break;
			case this.keycodeS:
				this.S = false;
				break;
			case this.keycodeD:
				this.D = false;
				break;
			default:
				break;
		}
	}

	move()
	{
		// left/right
		let dx = 0;
		if (this.A)
		{
			dx -= 1;
		}
		if (this.D)
		{
			dx += 1;
		}

		dx *= this.moveSpeed;
		dx = this.localRight.scale(new Vector(dx, 0, dx), false);

		let dy = 0;
		dy = this.localUp.scale(new Vector (dy, 0, dy), false);

		// forward/back
		let dz = 0;
		if (this.W)
		{
			dz += 1;
		}
		if (this.S)
		{
			dz -= 1;
		}

		dz *= this.moveSpeed;
		dz = this.forward.scale(new Vector(dz, 0, dz), false);

		dx.add(dy);
		dx.add(dz);
		this.translate(dx);
	}

	onMouseMove = (mouseDX, mouseDY) => {
		this.mouseDX = mouseDX;
		this.mouseDY = mouseDY;
		const dy = -this.linMap(this.mouseDX, -window.innerWidth, window.innerWidth, -this.turnSpeed, this.turnSpeed);
		const dx = -this.linMap(this.mouseDY, -window.innerHeight, window.innerHeight, -this.turnSpeed, this.turnSpeed);
		
		if (dx !== 0 || dy !== 0) {
			this.rotX += dx;
			if (this.rotX > this.rotLimitX) {
				this.rotX = this.rotLimitX;
			} else if (this.rotX < -this.rotLimitX) {
				this.rotX = -this.rotLimitX;
			}

			this.rotY += dy;
			if (this.rotY > this.rotLimitY) {
				this.rotY -= 2 * this.rotLimitY
			} else if (this.rotY < -this.rotLimitY) {
				this.rotY += 2 * this.rotLimitY;
			}

			const rot = new Quaternion(this.rotX, 1, 0, 0);
			rot.compose(new Quaternion(this.rotY, 0, 1, 0));

			this.setRotation(rot);
		}
	};

	linMap = (x, fromMin, fromMax, toMin, toMax) => toMin + (((x - fromMin) * (toMax - toMin)) / (fromMax - fromMin));
	update()
	{
		this.move();
		super.update();
	}

	lookAt(target, up=this.localUp)
	{
		super.lookAt(target, up);
		this.setRots();
	}

	setRots() // assumes no roll has been applied; deletes any roll that has been applied
	{
		const sinX = -this.forward.y;
		this.rotX = -Math.asin(sinX);
		const cosX = Math.sqrt(1 - sinX * sinX);
		if (Math.abs(cosX) < 0.01)
		{
			this.rotY = -Math.asin(this.localUp.x / sinX);
			if (this.localUp.z < 0)
			{
				if (-this.forward.y < 0)
				{
					this.rotY = Math.PI - this.rotY;
				}
			}
			else
			{
				if (-this.forward.y > 0)
				{
					this.rotY = Math.PI - this.rotY;
				}
			}
		}
		else
		{
			this.rotY = Math.asin(-this.forward.x / cosX);
			if (-this.forward.z < 0)
			{
				this.rotY = Math.PI - this.rotY;
			}
		}
	}
}


