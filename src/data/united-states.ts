export const UNITED_STATES_TREE = {
  "country": "United States",
  "note": "Conflict-focused U.S. national-security and command structure as of 19 March 2026. Includes executive, diplomatic, intelligence, overseas operational, and homeland-defense roles relevant to the Iran conflict / Operation Epic Fury timeline.",
  "persons": {
    "donald-trump": {
      "id": "donald-trump",
      "name": "Donald J. Trump",
      "status": "alive",
      "metadata": {
        "notes": "President of the United States and Commander in Chief since 20 January 2025. Ordered Operation Epic Fury.",
        "type": "civilian"
      }
    },
    "jd-vance": {
      "id": "jd-vance",
      "name": "J.D. Vance",
      "status": "alive",
      "metadata": {
        "notes": "Vice President of the United States since 20 January 2025. Constitutional successor to the President, but not in the normal wartime operational chain of command.",
        "type": "civilian"
      }
    },
    "pete-hegseth": {
      "id": "pete-hegseth",
      "name": "Pete Hegseth",
      "status": "alive",
      "metadata": {
        "notes": "Secretary of War / formerly Secretary of Defense since 25 January 2025. Principal civilian defense official beneath the President. Exercises authority over combatant commands through the Department of War.",
        "type": "civilian"
      }
    },
    "steve-feinberg": {
      "id": "steve-feinberg",
      "name": "Steve Feinberg",
      "status": "alive",
      "metadata": {
        "notes": "Deputy Secretary of War since 17 March 2025. Senior deputy to the Secretary; continuity role in major operations.",
        "type": "civilian"
      }
    },
    "marco-rubio": {
      "id": "marco-rubio",
      "name": "Marco Rubio",
      "status": "alive",
      "metadata": {
        "notes": "Secretary of State since 21 January 2025. Principal diplomatic official managing coalition, escalation messaging, and crisis diplomacy during the Iran conflict.",
        "type": "civilian"
      }
    },
    "christopher-landau": {
      "id": "christopher-landau",
      "name": "Christopher Landau",
      "status": "alive",
      "metadata": {
        "notes": "Deputy Secretary of State since 25 March 2025. Senior State Department continuity and management role.",
        "type": "civilian"
      }
    },
    "mike-waltz": {
      "id": "mike-waltz",
      "name": "Mike Waltz",
      "status": "alive",
      "metadata": {
        "notes": "Assistant to the President and National Security Advisor since 20 January 2025. Coordinates NSC process and interagency policy, but is not in the statutory chain of military command.",
        "type": "civilian"
      }
    },
    "tulsi-gabbard": {
      "id": "tulsi-gabbard",
      "name": "Tulsi Gabbard",
      "status": "alive",
      "metadata": {
        "notes": "Director of National Intelligence since 12 February 2025. Leads Intelligence Community integration and threat assessment.",
        "type": "civilian"
      }
    },
    "john-ratcliffe": {
      "id": "john-ratcliffe",
      "name": "John Ratcliffe",
      "status": "alive",
      "metadata": {
        "notes": "Director of the Central Intelligence Agency since 23 January 2025. Key intelligence and covert-action leader; CIA Director operates within the Intelligence Community under the DNI framework.",
        "type": "civilian"
      }
    },
    "dan-caine": {
      "id": "dan-caine",
      "name": "Dan Caine",
      "status": "alive",
      "metadata": {
        "rank": "General",
        "notes": "Chairman of the Joint Chiefs of Staff since 11 April 2025. Principal military advisor to the President, Secretary of War, and NSC; advisory role, not operational commander.",
        "type": "military"
      }
    },
    "christopher-mahoney": {
      "id": "christopher-mahoney",
      "name": "Christopher J. Mahoney",
      "status": "alive",
      "metadata": {
        "rank": "General",
        "notes": "Vice Chairman of the Joint Chiefs of Staff since 1 October 2025. Senior military advisory and continuity role.",
        "type": "military"
      }
    },
    "brad-cooper": {
      "id": "brad-cooper",
      "name": "Brad Cooper",
      "status": "alive",
      "metadata": {
        "rank": "Admiral",
        "notes": "Commander of U.S. Central Command since 8 August 2025. Primary operational commander for the Middle East theater and direct theater commander for Operation Epic Fury.",
        "type": "military"
      }
    },
    "gregory-guillot": {
      "id": "gregory-guillot",
      "name": "Gregory M. Guillot",
      "status": "alive",
      "metadata": {
        "rank": "General",
        "notes": "Commander of U.S. Northern Command and NORAD since 5 February 2024. Leads homeland defense and defense support to civil authorities.",
        "type": "military"
      }
    },
    "kristi-noem": {
      "id": "kristi-noem",
      "name": "Kristi Noem",
      "status": "alive",
      "metadata": {
        "notes": "Secretary of Homeland Security since 25 January 2025. Oversees domestic security, border, infrastructure, and consequence-management functions relevant to conflict spillover. Announced 31 March 2026 as her final day.",
        "type": "civilian"
      }
    },
    "troy-edgar": {
      "id": "troy-edgar",
      "name": "Troy Edgar",
      "status": "alive",
      "metadata": {
        "notes": "Deputy Secretary of Homeland Security since 10 March 2025. Senior deputy and likely continuity figure during DHS transition.",
        "type": "civilian"
      }
    },
    "markwayne-mullin": {
      "id": "markwayne-mullin",
      "name": "Markwayne Mullin",
      "status": "alive",
      "metadata": {
        "notes": "Nominated on 9 March 2026 to become Secretary of Homeland Security, but not confirmed as of 19 March 2026.",
        "type": "civilian"
      }
    }
  },
  "roles": {
    "president": {
      "id": "president",
      "title": "President of the United States / Commander in Chief",
      "level": 0,
      "metadata": {
        "description": "Highest executive authority. Constitutional commander in chief of the armed forces.",
        "constitutionalBasis": "U.S. Constitution, Article II"
      }
    },
    "vice-president": {
      "id": "vice-president",
      "title": "Vice President of the United States",
      "parentRoleId": "president",
      "level": 1,
      "metadata": {
        "description": "First constitutional successor to the President; not normally part of the operational military chain."
      }
    },
    "secretary-of-war": {
      "id": "secretary-of-war",
      "title": "Secretary of War / formerly Secretary of Defense",
      "parentRoleId": "president",
      "level": 1,
      "metadata": {
        "description": "Principal civilian defense official. Operational military orders run from the President to the Secretary to combatant commanders."
      }
    },
    "deputy-secretary-of-war": {
      "id": "deputy-secretary-of-war",
      "title": "Deputy Secretary of War",
      "parentRoleId": "secretary-of-war",
      "level": 2
    },
    "secretary-of-state": {
      "id": "secretary-of-state",
      "title": "Secretary of State",
      "parentRoleId": "president",
      "level": 1,
      "metadata": {
        "description": "Leads diplomacy, alliance management, de-escalation channels, sanctions, and war-related foreign policy."
      }
    },
    "deputy-secretary-of-state": {
      "id": "deputy-secretary-of-state",
      "title": "Deputy Secretary of State",
      "parentRoleId": "secretary-of-state",
      "level": 2
    },
    "national-security-advisor": {
      "id": "national-security-advisor",
      "title": "Assistant to the President for National Security Affairs",
      "parentRoleId": "president",
      "level": 1,
      "metadata": {
        "description": "Coordinates the National Security Council process and interagency policy. Powerful in practice but advisory, not statutory command."
      }
    },
    "dni": {
      "id": "dni",
      "title": "Director of National Intelligence",
      "parentRoleId": "president",
      "level": 1,
      "metadata": {
        "description": "Head of the U.S. Intelligence Community. Integrates intelligence across agencies."
      }
    },
    "cia-director": {
      "id": "cia-director",
      "title": "Director of the Central Intelligence Agency",
      "parentRoleId": "dni",
      "level": 2,
      "metadata": {
        "description": "Leads CIA intelligence and covert-action functions within the broader IC structure."
      }
    },
    "chairman-jcs": {
      "id": "chairman-jcs",
      "title": "Chairman of the Joint Chiefs of Staff",
      "parentRoleId": "president",
      "level": 1,
      "metadata": {
        "description": "Principal military advisor to the President and Secretary of War. Not in the operational chain of command."
      }
    },
    "vice-chairman-jcs": {
      "id": "vice-chairman-jcs",
      "title": "Vice Chairman of the Joint Chiefs of Staff",
      "parentRoleId": "chairman-jcs",
      "level": 2
    },
    "centcom-commander": {
      "id": "centcom-commander",
      "title": "Commander, U.S. Central Command",
      "parentRoleId": "secretary-of-war",
      "reportsTo": [
        "president",
        "secretary-of-war"
      ],
      "level": 2,
      "metadata": {
        "description": "Operational commander for the Middle East theater. Main warfighting commander for the Iran conflict."
      }
    },
    "northcom-commander": {
      "id": "northcom-commander",
      "title": "Commander, U.S. Northern Command",
      "parentRoleId": "secretary-of-war",
      "reportsTo": [
        "president",
        "secretary-of-war"
      ],
      "level": 2,
      "metadata": {
        "description": "Operational commander for homeland defense and defense support to civil authorities."
      }
    },
    "secretary-of-homeland-security": {
      "id": "secretary-of-homeland-security",
      "title": "Secretary of Homeland Security",
      "parentRoleId": "president",
      "level": 1,
      "metadata": {
        "description": "Cabinet official responsible for domestic security, border, critical infrastructure, and consequence management."
      }
    },
    "deputy-secretary-of-homeland-security": {
      "id": "deputy-secretary-of-homeland-security",
      "title": "Deputy Secretary of Homeland Security",
      "parentRoleId": "secretary-of-homeland-security",
      "level": 2
    }
  },
  "tenures": {
    "t-trump-pres": {
      "id": "t-trump-pres",
      "personId": "donald-trump",
      "roleId": "president",
      "startDate": "2025-01-20",
      "isActive": true
    },
    "t-vance-vp": {
      "id": "t-vance-vp",
      "personId": "jd-vance",
      "roleId": "vice-president",
      "startDate": "2025-01-20",
      "isActive": true
    },
    "t-hegseth-war": {
      "id": "t-hegseth-war",
      "personId": "pete-hegseth",
      "roleId": "secretary-of-war",
      "startDate": "2025-01-25",
      "isActive": true
    },
    "t-feinberg-dep-war": {
      "id": "t-feinberg-dep-war",
      "personId": "steve-feinberg",
      "roleId": "deputy-secretary-of-war",
      "startDate": "2025-03-17",
      "isActive": true
    },
    "t-rubio-state": {
      "id": "t-rubio-state",
      "personId": "marco-rubio",
      "roleId": "secretary-of-state",
      "startDate": "2025-01-21",
      "isActive": true
    },
    "t-landau-dep-state": {
      "id": "t-landau-dep-state",
      "personId": "christopher-landau",
      "roleId": "deputy-secretary-of-state",
      "startDate": "2025-03-25",
      "isActive": true
    },
    "t-waltz-nsa": {
      "id": "t-waltz-nsa",
      "personId": "mike-waltz",
      "roleId": "national-security-advisor",
      "startDate": "2025-01-20",
      "isActive": true
    },
    "t-gabbard-dni": {
      "id": "t-gabbard-dni",
      "personId": "tulsi-gabbard",
      "roleId": "dni",
      "startDate": "2025-02-12",
      "isActive": true
    },
    "t-ratcliffe-cia": {
      "id": "t-ratcliffe-cia",
      "personId": "john-ratcliffe",
      "roleId": "cia-director",
      "startDate": "2025-01-23",
      "isActive": true
    },
    "t-caine-cjcs": {
      "id": "t-caine-cjcs",
      "personId": "dan-caine",
      "roleId": "chairman-jcs",
      "startDate": "2025-04-11",
      "isActive": true
    },
    "t-mahoney-vcjcs": {
      "id": "t-mahoney-vcjcs",
      "personId": "christopher-mahoney",
      "roleId": "vice-chairman-jcs",
      "startDate": "2025-10-01",
      "isActive": true
    },
    "t-cooper-centcom": {
      "id": "t-cooper-centcom",
      "personId": "brad-cooper",
      "roleId": "centcom-commander",
      "startDate": "2025-08-08",
      "isActive": true
    },
    "t-guillot-northcom": {
      "id": "t-guillot-northcom",
      "personId": "gregory-guillot",
      "roleId": "northcom-commander",
      "startDate": "2024-02-05",
      "isActive": true
    },
    "t-noem-dhs": {
      "id": "t-noem-dhs",
      "personId": "kristi-noem",
      "roleId": "secretary-of-homeland-security",
      "startDate": "2025-01-25",
      "isActive": true,
      "metadata": {
        "announcedEndDate": "2026-03-31",
        "note": "Still active as of 19 March 2026 despite announced departure date."
      }
    },
    "t-edgar-dep-dhs": {
      "id": "t-edgar-dep-dhs",
      "personId": "troy-edgar",
      "roleId": "deputy-secretary-of-homeland-security",
      "startDate": "2025-03-10",
      "isActive": true
    },
    "t-mullin-dhs-nominee": {
      "id": "t-mullin-dhs-nominee",
      "personId": "markwayne-mullin",
      "roleId": "secretary-of-homeland-security",
      "startDate": "2026-03-09",
      "isActive": false,
      "metadata": {
        "status": "nominated_pending_confirmation",
        "note": "Nominee only; does not yet hold the office."
      }
    }
  },
  "events": {
    "ev-trump-inaugurated": {
      "id": "ev-trump-inaugurated",
      "type": "inauguration",
      "date": "2025-01-20",
      "personId": "donald-trump",
      "roleId": "president",
      "tenureId": "t-trump-pres",
      "description": "Donald J. Trump inaugurated as President and Commander in Chief."
    },
    "ev-vance-inaugurated": {
      "id": "ev-vance-inaugurated",
      "type": "inauguration",
      "date": "2025-01-20",
      "personId": "jd-vance",
      "roleId": "vice-president",
      "tenureId": "t-vance-vp",
      "description": "J.D. Vance inaugurated as Vice President."
    },
    "ev-hegseth-confirmed": {
      "id": "ev-hegseth-confirmed",
      "type": "appointment",
      "date": "2025-01-25",
      "personId": "pete-hegseth",
      "roleId": "secretary-of-war",
      "tenureId": "t-hegseth-war",
      "description": "Pete Hegseth sworn in as Secretary of Defense, later redesignated Secretary of War after the department name change."
    },
    "ev-rubio-confirmed": {
      "id": "ev-rubio-confirmed",
      "type": "appointment",
      "date": "2025-01-21",
      "personId": "marco-rubio",
      "roleId": "secretary-of-state",
      "tenureId": "t-rubio-state",
      "description": "Marco Rubio sworn in as Secretary of State."
    },
    "ev-gabbard-confirmed": {
      "id": "ev-gabbard-confirmed",
      "type": "appointment",
      "date": "2025-02-12",
      "personId": "tulsi-gabbard",
      "roleId": "dni",
      "tenureId": "t-gabbard-dni",
      "description": "Tulsi Gabbard sworn in as Director of National Intelligence."
    },
    "ev-ratcliffe-confirmed": {
      "id": "ev-ratcliffe-confirmed",
      "type": "appointment",
      "date": "2025-01-23",
      "personId": "john-ratcliffe",
      "roleId": "cia-director",
      "tenureId": "t-ratcliffe-cia",
      "description": "John Ratcliffe sworn in as Director of the CIA."
    },
    "ev-caine-appointed": {
      "id": "ev-caine-appointed",
      "type": "appointment",
      "date": "2025-04-11",
      "personId": "dan-caine",
      "roleId": "chairman-jcs",
      "tenureId": "t-caine-cjcs",
      "description": "Dan Caine became the 22nd Chairman of the Joint Chiefs of Staff."
    },
    "ev-mahoney-appointed": {
      "id": "ev-mahoney-appointed",
      "type": "appointment",
      "date": "2025-10-01",
      "personId": "christopher-mahoney",
      "roleId": "vice-chairman-jcs",
      "tenureId": "t-mahoney-vcjcs",
      "description": "Christopher J. Mahoney sworn in as Vice Chairman of the Joint Chiefs of Staff."
    },
    "ev-cooper-centcom": {
      "id": "ev-cooper-centcom",
      "type": "appointment",
      "date": "2025-08-08",
      "personId": "brad-cooper",
      "roleId": "centcom-commander",
      "tenureId": "t-cooper-centcom",
      "description": "Brad Cooper assumed command of U.S. Central Command."
    },
    "ev-epic-fury-begins": {
      "id": "ev-epic-fury-begins",
      "type": "military_operation_start",
      "date": "2026-02-28",
      "personId": "donald-trump",
      "roleId": "president",
      "fromPersonId": "donald-trump",
      "toPersonId": "brad-cooper",
      "description": "U.S. Central Command commenced Operation Epic Fury at the direction of the President. CENTCOM described the initial wave of U.S. and partner strikes on 28 February 2026."
    },
    "ev-epic-fury-announced": {
      "id": "ev-epic-fury-announced",
      "type": "public_announcement",
      "date": "2026-03-01",
      "personId": "donald-trump",
      "roleId": "president",
      "description": "The White House publicly framed and announced Operation Epic Fury as a campaign against Iran's nuclear, missile, naval, and proxy capabilities."
    },
    "ev-noem-departure-announced": {
      "id": "ev-noem-departure-announced",
      "type": "resignation_announced",
      "date": "2026-03-05",
      "personId": "kristi-noem",
      "roleId": "secretary-of-homeland-security",
      "tenureId": "t-noem-dhs",
      "description": "Kristi Noem announced that 31 March 2026 would be her final day as Secretary of Homeland Security."
    },
    "ev-mullin-nominated": {
      "id": "ev-mullin-nominated",
      "type": "nomination",
      "date": "2026-03-09",
      "personId": "markwayne-mullin",
      "roleId": "secretary-of-homeland-security",
      "tenureId": "t-mullin-dhs-nominee",
      "toPersonId": "markwayne-mullin",
      "description": "Markwayne Mullin was nominated to become Secretary of Homeland Security, pending Senate confirmation."
    }
  },
  "controlStates": {
    "cs-president": {
      "roleId": "president",
      "deFactoHolderId": "donald-trump",
      "deJureHolderId": "donald-trump",
      "contested": false
    },
    "cs-war": {
      "roleId": "secretary-of-war",
      "deFactoHolderId": "pete-hegseth",
      "deJureHolderId": "pete-hegseth",
      "contested": false
    },
    "cs-state": {
      "roleId": "secretary-of-state",
      "deFactoHolderId": "marco-rubio",
      "deJureHolderId": "marco-rubio",
      "contested": false
    },
    "cs-nsa": {
      "roleId": "national-security-advisor",
      "deFactoHolderId": "mike-waltz",
      "deJureHolderId": "mike-waltz",
      "contested": false,
      "metadata": {
        "note": "Powerful coordinating role, but advisory rather than statutory command."
      }
    },
    "cs-dni": {
      "roleId": "dni",
      "deFactoHolderId": "tulsi-gabbard",
      "deJureHolderId": "tulsi-gabbard",
      "contested": false
    },
    "cs-cia": {
      "roleId": "cia-director",
      "deFactoHolderId": "john-ratcliffe",
      "deJureHolderId": "john-ratcliffe",
      "contested": false
    },
    "cs-cjcs": {
      "roleId": "chairman-jcs",
      "deFactoHolderId": "dan-caine",
      "deJureHolderId": "dan-caine",
      "contested": false,
      "metadata": {
        "note": "Principal military advisor, not operational commander."
      }
    },
    "cs-centcom": {
      "roleId": "centcom-commander",
      "deFactoHolderId": "brad-cooper",
      "deJureHolderId": "brad-cooper",
      "contested": false,
      "metadata": {
        "note": "Main operational command for the Iran theater."
      }
    },
    "cs-northcom": {
      "roleId": "northcom-commander",
      "deFactoHolderId": "gregory-guillot",
      "deJureHolderId": "gregory-guillot",
      "contested": false,
      "metadata": {
        "note": "Primary homeland-defense combatant commander."
      }
    },
    "cs-dhs": {
      "roleId": "secretary-of-homeland-security",
      "deFactoHolderId": "kristi-noem",
      "deJureHolderId": "kristi-noem",
      "contested": false,
      "metadata": {
        "note": "No vacancy as of 19 March 2026, but transition is pending. Markwayne Mullin is nominated; not yet confirmed."
      }
    }
  }
} as const;
