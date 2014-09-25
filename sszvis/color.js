namespace('sszvis.color', function(module) {

  module.exports.values = {
    basicBlue: "#6392C5",
    basicDeepBlue: "#3A75B2"
  };

  module.exports.ranges = {
    qualitative: {
      qual3: [
        "#b8cfe6",
        "#5182b3",
        "#e6b7c7"
      ],
      qual6: [
        "#b8cfe6",
        "#5182b3",
        "#e6b7c7",
        "#cc6788",
        "#f2cec2",
        "#e67d73"
      ],
      qual9: [
        "#b8cfe6",
        "#5182b3",
        "#e6b7c7",
        "#cc6788",
        "#f2cec2",
        "#e67d73",
        "#faebaf",
        "#e6cf73",
        "#cfe6b8"
      ],
      qual12: [
        "#b8cfe6",
        "#5182b3",
        "#e6b7c7",
        "#cc6788",
        "#f2cec2",
        "#e67d73",
        "#faebaf",
        "#e6cf73",
        "#cfe6b8",
        "#94bf69",
        "#b8e6d2",
        "#60bf97"
      ]
    },
    sequential: {
      valued: {
        blue: [
          "#dce8fd",
          "#3a75b2",
          "#333e4c"
        ],
        red: [
          "#fdebeb",
          "#cb6070",
          "#4c3439"
        ]
      },
      neutral: {
        green: [
          "#d1dedd",
          "497f7b",
          "#2b3b3e"
        ],
        brown: [
          "#e8ded5",
          "#a57c59",
          "#4b3634"
        ]
      }
    },
    divergent: {
      valued: {
        bluWhtRed: [
          "#3a75b2",
          "#ffffff",
          "#cb6070"
        ],
        bluGryRed: [
          "#3a75b2",
          "#f2f2f2",
          "#cb6070"
        ]
      },
      neutral: {
        grnWhtBrn: [
          "#497f7b",
          "#ffffff",
          "#a57c59"
        ],
        grnGryBrn: [
          "#497f7b",
          "#f2f2f2",
          "#a57c59"
        ]
      }
    }
  };

});
