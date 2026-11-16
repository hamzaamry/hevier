// Look-alike catalogue entries that are the same move as another one (the
// same exercise drawn on another figure), checked by eye on 2026-11-07.
// Each is left out of our catalogue; the value is the entry kept instead.
// An installed one is only removed when nothing uses it (migration 013).
export const HIDDEN_EXERCISES: Record<string, string> = {
  '2249': '0241', // Triceps Pushdown - V Bar (Cable) -> Triceps Pushdown
  '4355': '0241', // Triceps Pushdown V2 - V Bar (Cable) -> Triceps Pushdown
  '7892': '2188', // Seated Triceps Extension V2 (Dumbbell) -> Triceps Extension (Dumbbell)
  '2683': '0082', // Reverse Wrist Curl V2 (Barbell) -> Seated Wrist Extension (Barbell)
  '9066': '10818', // 4 Way Single Leg Hop -> 4 Way Single Leg Hop V2
  '4515': '1405', // Back Pec Stretch V2 -> Back Pec Stretch
  '5302': '0020', // Balance Board V2 -> Balance Board
  '5122': '5190', // Clean and Jerk (Barbell) -> Clean and Jerk V2 (Barbell)
  '2394': '2844', // Floor Hyperextension -> Floor Hyperextension V2
  '5213': '0630', // Mountain Climber V2 -> Mountain Climber
  '4859': '0664', // Push Up to Side Plank V2 -> Push-up to Side Plank
  '0867': '4934', // Reverse Plank #2 -> Reverse Plank V2
  '7113': '0433', // Straight Arm Pullover V2 (Dumbbell) #2 -> Straight Arm Pullover (Dumbbell)
  '1104': '5876', // Suspension Triceps Extension V2 -> Suspension Triceps Extension
  '7751': '7563', // Swing Clean Grip Front Squat V2 (Kettlebell) -> Swing Clean Grip Front Squat (Kettlebell)
  '2969': '2968', // Thruster V2 (Dumbbell) -> Thruster (Dumbbell)
  '5130': '0815', // Triceps Dip Floor V2 -> Floor Triceps Dip
  '1069': '0243', // Twist V3 (Cable) -> Twist (Cable)
  '5118': '0243', // Twist V2 (Cable) -> Twist (Cable)
  '1208': '0862', // Twist V2 - Up Down (Cable) -> Twist - Up-down (Cable)
  '6016': '4620', // Twisting Crunch V2 -> Twisting Crunch
  '0121': '0120', // Upright Row V3 (Barbell) -> Upright Row (Barbell)
  '0119': '0120', // Upright Row V2 (Barbell) -> Upright Row (Barbell)
  '4250': '3336', // V Up V2 (Dumbbell) -> V Up (Dumbbell)
  '2544': '1325', // Wide Grip Rear Pulldown Behind Neck V2 (Cable) -> Wide Grip Rear Pulldown Behind Neck (Cable)
  '2291': '0150', // Wide Grip Lat Pulldown (Cable), a female figure -> Bar Lateral Pulldown (Cable) (migration 014)
  // Checked by eye on 2026-11-16: copies (the same move again, or drawn on the
  // other figure) of another entry.
  '0097': '0098', // Side Split Squat V2 (Barbell) -> Side Split Squat (Barbell)
  '0166': '0165', // Hammer Curl (Cable) #2 -> Hammer Curl (Cable)
  '0181': '0182', // Lying Close Grip Curl (Cable) -> Lying Close-grip Curl (Cable)
  '0250': '4280', // Ceiling Look Stretch -> Ceiling Look Stretch V2
  '0275': '0274', // Crunch Floor V2 -> Crunch Floor
  '0287': '2137', // Arnold Press V2 (Dumbbell) -> Arnold Press (Dumbbell)
  '0296': '1731', // Close-grip Press (Dumbbell) -> Close Grip Press (Dumbbell)
  '0304': '0305', // Decline Shrug V2 (Dumbbell) -> Decline Shrug (Dumbbell)
  '0309': '0310', // Front Raise V2 (Dumbbell) -> Front Raise (Dumbbell)
  '0312': '0313', // Hammer Curl (Dumbbell) #2 -> Hammer Curl (Dumbbell)
  '0342': '0343', // Lying One Arm Press V2 (Dumbbell) -> Lying One Arm Press (Dumbbell)
  '0360': '0361', // One Arm Shoulder Press V2 (Dumbbell) -> One Arm Shoulder Press (Dumbbell)
  '0395': '0396', // Seated Lateral Raise V2 (Dumbbell) -> Seated Lateral Raise (Dumbbell)
  '0485': '0486', // Hip Raise Bridge V2 -> Hip Raise Bridge
  '0513': '0514', // Jump Squat V2 -> Jump Squat
  '0556': '5810', // Kicks Leg Bent V2 -> Kicks Leg Bent
  '0617': '3393', // Lying Hip Leg Raise - On Floor -> Lying Leg Hip Raise on Floor
  '0658': '0659', // Push-up V2 - Wall -> Push-up - Wall
  '0706': '0705', // Side Bridge -> Side Bridge V2
  '0711': '8971', // Side Lunge Stretch -> Side Lunge Stretch V2
  '0781': '2368', // Split Squat -> Split Squats
  '0785': '7556', // Squat Jacks -> Squat Jack
  '0823': '3621', // Twisting Crunch - Arms Straight -> Twisting Crunch - Straight Arms
  '0880': '0228', // Standing Hip Extension V2 (Cable) -> Standing Hip Extension (Cable)
  '0881': '8664', // Curtsey Lunge (Dumbbell) -> Curtsey Lunge V2 (Dumbbell)
  '0892': '3899', // Bent Over Row V2 (Band) -> Bent Over Row (Band) #2
  '0893': '6486', // Bent Over Rear Lateral Raise V3 (Band) -> Bent Over Rear Lateral Raise V2 (Band)
  '0897': '4687', // Hammer Curl (Band) -> Hammer Curl (Band) #2
  '0905': '0983', // Kneeling Pulldown (Band) #2 -> Kneeling Pulldown (Band)
  '0907': '0977', // Lateral Raise (Band) #2 -> Lateral Raise (Band)
  '0943': '0944', // Chair Pose Utkatasana V2 -> Chair Pose Utkatasana
  '1067': '6036', // Straight Arm Pulldown V3 (Cable) -> Straight Arm Pulldown V2 (Cable)
  '1068': '0860', // Kickback V3 (Cable) -> Kickback (Cable)
  '10877': '10871', // Plate Crunch V2 - Hands Overhead (Weighted) -> Plate Crunch - Hands Overhead (Weighted)
  '10903': '10660', // Assisted Single Arm Pull Up V2 (Band) -> Assisted Single Arm Pull Up (Band)
  '10904': '8358', // Hamstring Bridge V2 -> Hamstring Bridge
  '10932': '2088', // Shoulder Stretch Behind the Back with Towel -> Shoulder Stretch with Towel Behind the Back
  '10977': '7328', // Hyperextension V2 (Dumbbell) -> Hyperextension (Dumbbell)
  '1117': '6222', // Jump Squat (Suspension) -> Squat Jump (Suspension)
  '11452': '4510', // Calves Stretch V2 -> Calves Stretch
  '11570': '4034', // Standing Hip Extension (Band) -> Standing Hip Extension (Band) #2
  '1177': '0340', // Lying Hammer Press V2 (Dumbbell) -> Lying Hammer Press (Dumbbell)
  '1179': '0459', // Flutter Kicks V2 -> Flutter Kicks
  '1243': '0276', // Dead Bug V2 -> Dead Bug
  '1371': '0088', // Seated Calf Raise (Barbell) #2 -> Seated Calf Raise (Barbell)
  '1439': '0580', // Gripless Shrug V2 (Machine) -> Gripless Shrug (Machine)
  '1478': '3930', // Jack Plank -> Plank Jack
  '1508': '0977', // Lateral Raise V2 (Band) -> Lateral Raise (Band)
  '1555': '0413', // Squat V2 (Dumbbell) -> Squat (Dumbbell)
  '1614': '0592', // Preacher Curl V2 (Machine) -> Preacher Curl (Machine)
  '1657': '0298', // Cross Body Hammer Curl V2 (Dumbbell) -> Cross Body Hammer Curl (Dumbbell)
  '2106': '1051', // Cat Stretch V2 -> Cat Stretch
  '2136': '0299', // Cuban Press V2 (Dumbbell) -> Cuban Press (Dumbbell)
  '2189': '2188', // Seated Triceps Extension (Dumbbell) -> Triceps Extension (Dumbbell)
  '2198': '0607', // Triceps Extension V3 (Machine) -> Triceps Extension (Machine)
  '2290': '0410', // Bulgarian Split Squat (Dumbbell) #2 -> Bulgarian Split Squat (Dumbbell)
  '2314': '2276', // Lying Crunch V2 (Machine) -> Lying Crunch (Machine)
  '2321': '1228', // Standing Inner Biceps Curl V2 (Dumbbell) -> Standing Inner Biceps Curl (Dumbbell)
  '2323': '5121', // Sumo Squat (Dumbbell) -> Sumo Squat (Dumbbell) #2
  '2371': '0846', // Russian Twist V2 (Weighted) -> Russian Twist (Weighted)
  '2381': '0361', // One Arm Shoulder Press V3 (Dumbbell) -> One Arm Shoulder Press (Dumbbell)
  '2393': '0292', // One Arm Bent Over Row (Dumbbell) -> Bent Over Row (Dumbbell)
  '2395': '0003', // Air Bike V2 -> Air Bike
  '2485': '0313', // Hammer Curl V3 (Dumbbell) -> Hammer Curl (Dumbbell)
  '2555': '2154', // Glute Bridge V2 (Band) -> Glute Bridge (Band)
  '2589': '0351', // Lying Triceps Extension V2 (Dumbbell) -> Lying Triceps Extension (Dumbbell)
  '2663': '2662', // High Row V3 - Plate Loaded (Machine) -> High Row V2 - Plate Loaded (Machine)
  '2671': '0761', // Narrow Row V2 (Smith Machine) -> Narrow Row (Smith Machine)
  '2760': '4050', // Hip Thrust (Band) -> Hip Thrusts (Band)
  '2868': '2329', // Spine Twist V2 -> Spine Twist
  '2872': '4309', // Single Leg Stretch V2 - Bent Knee -> Single Leg Stretch - Bent Knee
  '2873': '4315', // Spine Stretch Forward V2 -> Spine Stretch Forward
  '3023': '0984', // Lying Hip Internal Rotation V2 (Band) -> Lying Hip Internal Rotation (Band)
  '3094': '3220', // Jumping Jack #2 -> Jumping Jack
  '3121': '3144', // Seated Straight Back Row (Band) -> Seated Straight Back Row (Band) #2
  '3141': '1241', // Bird Dog V2 -> Bird Dog
  '3183': '1521', // Hang Clean Below the Knees V2 (Barbell) -> Hang Clean Below the Knees (Barbell)
  '3340': '0432', // Stiff Leg Deadlift V2 (Dumbbell) -> Stiff Leg Deadlift (Dumbbell)
  '3428': '0310', // Front Raise V3 (Dumbbell) -> Front Raise (Dumbbell)
  '3433': '3227', // Swimmer Kicks V2 - Male -> Swimmer Kicks
  '3436': '0803', // Superman #2 -> Superman
  '3593': '0043', // Squat (Barbell) #2 -> Squat (Barbell)
  '3623': '5477', // Vertical Leg Raise V3 - On Parallel Bars -> Vertical Leg Raise V2 - On Parallel Bars
  '3698': '1471', // Inchworm V2 -> Inchworm
  '3711': '0733', // Single Leg Step Up V2 -> Single Leg Step Up
  '3713': '1178', // Standing Single Leg Calf Raise V2 (Dumbbell) -> Standing Single Leg Calf Raise (Dumbbell)
  '3727': '0024', // Front Bench Squat (Barbell) -> Bench Front Squat (Barbell)
  '3742': '3395', // Sliding Leg Curl on Floor with Towel V2 -> Sliding Leg Curl on Floor with Towel
  '3764': '0315', // Incline Biceps Curl V2 (Dumbbell) -> Incline Biceps Curl (Dumbbell)
  '3767': '0411', // Single Leg Squat V2 (Dumbbell) -> Single Leg Squat (Dumbbell)
  '3786': '3770', // Squat with Single Arm Row (Band) #2 -> Squat with Single Arm Row (Band)
  '3787': '3771', // Deadlift with Single Arm Row (Band) #2 -> Deadlift with Single Arm Row (Band)
  '3788': '3772', // High Knee Lunge with Single Arm Row (Band) #2 -> High Knee Lunge with Single Arm Row (Band)
  '3789': '3773', // Single Stiff Leg Deadlift with Single Arm Row (Band) #2 -> Single Stiff Leg Deadlift with Single Arm Row (Band)
  '3791': '3777', // Front Plank with Single Arm Pulldown (Band) #2 -> Front Plank with Single Arm Pulldown (Band)
  '3792': '3778', // Upper Body Lying Air Bike (Band) #2 -> Upper Body Lying Air Bike (Band)
  '3793': '3781', // Split Jump with Single Arm Row (Band) #2 -> Split Jump with Single Arm Row (Band)
  '3794': '3782', // Jump Lunge with Single Arm Row (Band) #2 -> Jump Lunge with Single Arm Row (Band)
  '3795': '3779', // Skier (Band) #2 -> Skier (Band)
  '3796': '3774', // Squat with Horizontal Pallof Hold (Band) #2 -> Squat with Horizontal Pallof Hold (Band)
  '3797': '3775', // Split Squat with Horizontal Pallof Hold (Band) #2 -> Split Squat with Horizontal Pallof Hold (Band)
  '3948': '4714', // Air Squat -> Air Squat - Version 2
  '3973': '0409', // Single Leg Calf Raise V2 (Dumbbell) -> Single Leg Calf Raise (Dumbbell)
  '3996': '3905', // Circles Arm -> Arm Circles
  '4018': '3393', // Lying Leg Hip Raise on Floor V2 -> Lying Leg Hip Raise on Floor
  '4019': '0872', // Reverse Crunch V2 -> Reverse Crunch
  '4040': '3919', // Rear Lunge V2 (Landmine) -> Rear Lunge (Landmine)
  '4148': '4147', // Narrow Grip High Row V2 (Band) -> Narrow Grip High Row (Band)
  '4239': '0359', // One Arm Reverse Fly V2 - With Support (Dumbbell) -> One Arm Reverse Fly - With Support (Dumbbell)
  '4240': '0979', // Horizontal Pallof Press (Band) #2 -> Horizontal Pallof Press (Band)
  '4247': '4113', // Romanian Deadlift V2 (Landmine) -> Romanian Deadlift (Landmine)
  '4253': '3422', // Crunch V2 (Medicine Ball) -> Crunch (Medicine Ball)
  '4278': '0257', // Circles Knee Stretch V2 -> Circles Knee Stretch
  '4293': '0434', // Straight Legs Deadlift (Dumbbell) -> Straight Leg Deadlift (Dumbbell)
  '4295': '1557', // Walking Lunge (Dumbbell) -> Walking Lunges (Dumbbell)
  '4322': '3997', // Standing Side Bend V2 - Bent Arm -> Standing Side Bend - Bent Arm
  '4335': '0407', // Side Bend V2 (Dumbbell) -> Side Bend (Dumbbell)
  '4352': '1399', // Bench Dip on Floor V2 -> Bench Dip on Floor
  '4357': '4063', // Biceps Curl V2 (Band) -> Biceps Curl (Band)
  '4382': '3399', // Front Rack Lunge V2 (Barbell) -> Front Rack Lunge (Barbell)
  '4403': '4046', // Kettlebells Sumo Deadlift -> Sumo Deadlift (Kettlebell)
  '4474': '4473', // Roll Ball Piriformis V2 -> Roll Ball Piriformis
  '4486': '4485', // Roll Ball Infraspinatus V2 -> Roll Ball Infraspinatus
  '4488': '4487', // Roll Ball Scapula Levator V2 -> Roll Ball Scapula Levator
  '4492': '4491', // Roll Ball Trapezius Lower V2 -> Roll Ball Trapezius Lower
  '4568': '1503', // Pull Apart (Band) #2 -> Pull Apart (Band)
  '4616': '6013', // Leg Front Kick -> Front Leg Kick
  '4682': '4114', // Bent Over Rear Delt Fly (Band) #2 -> Bent Over Rear Delt Fly (Band)
  '4698': '3899', // Bent Over Row V3 (Band) -> Bent Over Row (Band) #2
  '4703': '4499', // Bodyweight Full Squat with Overhead Press - Version 2 -> Bodyweight Full Squat with Overhead Press
  '4715': '4702', // Alternating Superman V2 -> Alternating Superman
  '4719': '4205', // Assisted Dip - Version 2 (Band) -> Assisted Dip (Band)
  '4720': '4080', // Kneeling Crunch V2 (Band) -> Kneeling Crunch (Band)
  '4743': '0315', // Incline Biceps Curl V3 (Dumbbell) -> Incline Biceps Curl (Dumbbell)
  '4751': '3335', // Glute Bridge V2 (Dumbbell) -> Glute Bridge (Dumbbell)
  '4778': '0872', // Reverse Crunch V3 -> Reverse Crunch
  '4808': '1163', // Lying Leg Raise V2 -> Lying Leg Raise #2
  '4810': '3253', // Standing Side Bend V2 -> Standing Side Bend
  '4811': '0715', // Side Plank V3 -> Side Plank
  '4829': '3676', // Jump Skip Rope -> Skip Jump Rope
  '4831': '3497', // Sliding Floor Pulldown on Towel V2 -> Sliding Floor Pulldown on Towel
  '4887': '3335', // Glute Bridge V2 (Dumbbell) #2 -> Glute Bridge (Dumbbell)
  '4905': '4849', // Banded Glute Ham Raise V3 -> Banded Glute Ham Raise V2
  '4912': '4819', // Ring Leg Curl V2 -> Ring Leg Curl
  '4975': '1163', // Lying Leg Raise V3 -> Lying Leg Raise #2
  '4980': '4779', // Reverse Flutter Kick on Floor V2 - Hand Under Head -> Reverse Flutter Kick on Floor - Hand Under Head
  '5009': '4760', // Elevated Standing Calf Raise V2 -> Elevated Standing Calf Raise
  '5028': '3691', // Goblet Split Squat V2 (Dumbbell) -> Goblet Split Squat (Dumbbell)
  '5034': '4038', // One Arm Bent Over Row V2 (Landmine) -> One Arm Bent Over Row (Landmine)
  '5110': '0815', // Triceps Dip Floor -> Floor Triceps Dip
  '5119': '0300', // Deadlift V2 (Dumbbell) -> Deadlift (Dumbbell)
  '5193': '2906', // Power Sled Rear Drag V2 -> Power Sled Rear Drag
  '5206': '5202', // Kneeling Ab Crunch V2 (Band) -> Kneeling Ab Crunch (Band)
  '5330': '0375', // Pullover V2 (Dumbbell) -> Pullover (Dumbbell)
  '5334': '3951', // Cross Twisting Sit Up V2 -> Cross Twisting Sit Up
  '5336': '3574', // Forward Lunge V2 (Kettlebell) -> Forward Lunge (Kettlebell)
  '5633': '0063', // Narrow Stance Squat V2 (Barbell) -> Narrow Stance Squat (Barbell)
  '5657': '0222', // Side Bend V2 (Cable) -> Side Bend (Cable)
  '5741': '0175', // Kneeling Crunch V2 (Cable) -> Kneeling Crunch (Cable)
  '5754': '4742', // Hip Thrust V2 (Dumbbell) -> Hip Thrust (Dumbbell)
  '5837': '0991', // Pull Through (Band) #2 -> Pull Through (Band)
  '6367': '0224', // Standing Back Wrist Curl V2 (Cable) -> Standing Back Wrist Curl (Cable)
  '6428': '4007', // 90 Degree Heel Touch V2 -> 90 Degree Heel Touch
  '6785': '3006', // Seated Hip Abduction V2 (Band) -> Seated Hip Abduction (Band)
  '6806': '6800', // Military Press Russian Twist with Legs Floor Off V2 (Dumbbell) -> Military Press Russian Twist with Legs Floor Off (Dumbbell)
  '6890': '5667', // Z Press V2 (Dumbbell) -> Z Press (Dumbbell)
  '6914': '6913', // Sitting Scapular Adduction V2 -> Sitting Scapular Adduction
  '7108': '3386', // Seated Leg Extension V3 (Machine) -> Seated Leg Extension V2 (Machine)
  '7212': '2420', // Air Bike V2 (Band) -> Air Bike (Band)
  '7217': '3225', // Floor T Raise V2 -> Floor T Raise
  '7565': '1316', // Bent Arm Pullover V2 (Barbell) -> Bent Arm Pullover (Barbell)
  '7577': '4561', // Bodyweight Heel Elevated Squat -> Bodyweight Elevated Heel Squat
  '7619': '0501', // Jack Burpee V2 -> Jack Burpee
  '7839': '0276', // Dead Bug V3 -> Dead Bug
  '8075': '4755', // Single Leg Hip Thrust V2 (Dumbbell) -> Single Leg Hip Thrust (Dumbbell)
  '8364': '5205', // Overhead Shoulder Press V2 (Band) -> Overhead Shoulder Press (Band)
  '8366': '10192', // Side Swing V2 (Kettlebell) -> Side Swing (Kettlebell)
  '8900': '8880', // Standing Jab V2 (Cable) -> Standing Jab (Cable)
  '8901': '0192', // Single Arm Lateral Raise V2 (Cable) -> Single Arm Lateral Raise (Cable)
  '8916': '5153', // Side to Side Hop V2 -> Side to Side Hop
  '9314': '4937', // 45 Degree Hip Extension Glute Focused V2 -> 45 Degree Hip Extension Glute Focused
  '9931': '1675', // Spider Curl (Dumbbell) #2 -> Spider Curl (Dumbbell)
};

// Female drawings openGym doesn't link (checked by eye on 2026-11-16): entry id
// -> the same move on a female figure (its media id: a copy hidden above, or the
// drawing of one). Added to constants/femaleDrawings.ts by scripts/update-catalogue.ts.
export const FEMALE_COPIES: Record<string, string> = {
  '0003': '2395', // Air Bike
  '0043': '3593', // Squat (Barbell)
  '0165': '0166', // Hammer Curl (Cable)
  '0182': '0181', // Lying Close-grip Curl (Cable)
  '0228': '0880', // Standing Hip Extension (Cable)
  '0274': '0275', // Crunch Floor
  '0292': '2393', // Bent Over Row (Dumbbell)
  '0298': '2646', // Cross Body Hammer Curl (Dumbbell)
  '0361': '2381', // One Arm Shoulder Press (Dumbbell)
  '0375': '6484', // Pullover (Dumbbell)
  '0396': '2236', // Seated Lateral Raise (Dumbbell)
  '0410': '2290', // Bulgarian Split Squat (Dumbbell)
  '0459': '5734', // Flutter Kicks
  '0592': '2819', // Preacher Curl (Machine)
  '0705': '0706', // Side Bridge V2
  '0715': '4811', // Side Plank
  '0761': '2671', // Narrow Row (Smith Machine)
  '0803': '0804', // Superman
  '0815': '5110', // Floor Triceps Dip
  '0984': '3023', // Lying Hip Internal Rotation (Band)
  '1557': '4295', // Walking Lunges (Dumbbell)
  '2154': '2555', // Glute Bridge (Band)
  '2329': '2868', // Spine Twist
  '2368': '0781', // Split Squats
  '3220': '0516', // Jumping Jack
  '3393': '0617', // Lying Leg Hip Raise on Floor
  '3621': '0823', // Twisting Crunch - Straight Arms
  '3899': '0892', // Bent Over Row (Band) #2
  '3905': '0254', // Arm Circles
  '4050': '2760', // Hip Thrusts (Band)
  '4114': '4682', // Bent Over Rear Delt Fly (Band)
  '4280': '0250', // Ceiling Look Stretch V2
  '4309': '2872', // Single Leg Stretch - Bent Knee
  '4315': '2873', // Spine Stretch Forward
  '4687': '0897', // Hammer Curl (Band) #2
  '4714': '3948', // Air Squat - Version 2
  '4742': '5754', // Hip Thrust (Dumbbell)
  '5477': '3623', // Vertical Leg Raise V2 - On Parallel Bars
  '6013': '5082', // Front Leg Kick
  '6036': '1067', // Straight Arm Pulldown V2 (Cable)
  '6222': '1117', // Squat Jump (Suspension)
  '6486': '0893', // Bent Over Rear Lateral Raise V2 (Band)
  '7328': '10977', // Hyperextension (Dumbbell)
  '7556': '0785', // Squat Jack
  '8664': '0881', // Curtsey Lunge V2 (Dumbbell)
  '8971': '0711', // Side Lunge Stretch V2
};
